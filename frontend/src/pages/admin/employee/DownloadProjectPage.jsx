import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import { StatusBadge, PriorityBadge } from '../../../components/Badges';
import { 
  Download, FileArchive, Clock, Calendar, CheckSquare, Shield, 
  AlertTriangle, Upload, MessageSquare, CheckCircle, Play
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function DownloadProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  
  const [downloading, setDownloading] = useState(false);
  const [progressForm, setProgressForm] = useState({ progress: '', notes: '', blockers: '' });
  const [files, setFiles] = useState([]);
  const fileRef = useRef();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getById(id).then(r => r.data.project),
    enabled: !!id,
  });

  const pickupMutation = useMutation({
    mutationFn: () => projectsAPI.pickup(id),
    onSuccess: () => {
      toast.success('Project picked up successfully! 🚀');
      qc.invalidateQueries(['project', id]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to pick up project');
    }
  });

  const progressMutation = useMutation({
    mutationFn: (fd) => projectsAPI.updateProgress(id, fd),
    onSuccess: () => {
      toast.success('Progress updated and deliverables uploaded! 📊');
      qc.invalidateQueries(['project', id]);
      setProgressForm({ progress: '', notes: '', blockers: '' });
      setFiles([]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update progress');
    }
  });

  const reviewMutation = useMutation({
    mutationFn: () => projectsAPI.submitForReview(id),
    onSuccess: () => {
      toast.success('Submitted for admin review! 🎉');
      qc.invalidateQueries(['project', id]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error submitting project');
    }
  });

  const handleDownload = async () => {
    if (!project) return;
    setDownloading(true);
    const toastId = toast.loading('Generating secure download link...');
    try {
      const res = await projectsAPI.getSecureDownloadUrl(id);
      
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      link.setAttribute('target', '_blank');
      link.setAttribute('download', project.fileName || 'project-files');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Secure download link generated! Starting download...', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate secure download link', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const handleProgressSubmit = (e) => {
    e.preventDefault();
    if (!progressForm.progress) {
      toast.error('Please enter progress percentage');
      return;
    }
    const fd = new FormData();
    fd.append('progress', progressForm.progress);
    fd.append('notes', progressForm.notes);
    fd.append('blockers', progressForm.blockers);
    files.forEach(f => fd.append('files', f));
    progressMutation.mutate(fd);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Layout title="Secure Project Portal">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading project information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout title="Secure Project Portal">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Project Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            The project you are looking for does not exist or you do not have permission to view it.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const isAssignedToMe = project.assignedTo && project.assignedTo._id === user?._id;
  const isAvailable = project.status === 'available' || !project.assignedTo;
  const isOverdue = project.deadline && isPast(new Date(project.deadline)) && project.status !== 'completed';
  const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null;

  return (
    <Layout title="Project Portal" subtitle="View project information, download assets, and upload deliverables">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
        
        {/* Project Card */}
        <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
            <FileArchive className="w-8 h-8" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {project.projectId}
              </span>
              <PriorityBadge priority={project.priority} />
              <StatusBadge status={project.status} />
            </div>
            <h1 className="text-white font-bold text-2xl truncate mb-1">{project.name}</h1>
            <p className="text-slate-400 text-sm">{project.type}{project.clientName ? ` · ${project.clientName}` : ''}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Deadline</p>
              <p className={`font-medium text-sm ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                {project.deadline ? format(new Date(project.deadline), 'dd MMMM yyyy') : '—'}
                {project.deadline && (
                  <span className="text-[11px] block text-slate-400 mt-0.5">
                    {isOverdue ? `⚠️ ${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Estimated Time</p>
              <p className="text-white font-medium text-sm">
                {project.estimatedDays ? `${project.estimatedDays} Days` : '—'}
              </p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <CheckSquare className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Department</p>
              <p className="text-white font-medium text-sm">
                {project.department?.name || '—'}
              </p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <Shield className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Source File Size</p>
              <p className="text-white font-medium text-sm">{formatFileSize(project.fileSize)}</p>
            </div>
          </div>
        </div>

        {/* Project Instructions / Admin Description */}
        <div className="glass-card p-6 md:p-8">
          <h3 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Project Instructions</h3>
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-dark-900/50 p-4 rounded-xl border border-white/5">
            {project.description || 'No instructions provided by administration.'}
          </div>
        </div>

        {/* Action Panel depending on assignment */}
        {isAvailable ? (
          <div className="glass-card p-6 md:p-8 text-center flex flex-col items-center">
            <div className="max-w-md mb-6">
              <h3 className="text-white font-semibold mb-2">This Project is Available</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                You must pick up this project to start working on it. Once picked up, you will be assigned to it, and you'll be able to download the source files and submit progress logs.
              </p>
            </div>

            <button
              onClick={() => pickupMutation.mutate()}
              disabled={pickupMutation.isLoading}
              className="w-full max-w-xs py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              {pickupMutation.isLoading ? 'Picking Up...' : 'Pick Up Project'}
            </button>
          </div>
        ) : isAssignedToMe ? (
          <>
            {/* Download Files Section */}
            <div className="glass-card p-6 md:p-8 text-center flex flex-col items-center">
              <div className="max-w-md mb-6">
                <h3 className="text-white font-semibold mb-2">Secure Download Link</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Every download is tracked under your name. Your IP, browser user agent, and timestamp will be logged for security and audits.
                </p>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading || !project.fileName}
                className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {downloading ? 'Generating link...' : 'Download Project Files'}
              </button>

              <p className="text-slate-500 text-[11px] mt-3">
                Filename: <span className="text-slate-400 font-mono">{project.fileName || 'No files uploaded.'}</span>
              </p>
            </div>

            {/* Progress Update & Deliverables Upload Form */}
            <div className="glass-card p-6 md:p-8">
              <h3 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">Update Progress & Submit Deliverables</h3>
              
              <form onSubmit={handleProgressSubmit} className="space-y-5">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Progress Percentage ({progressForm.progress || project.progress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    value={progressForm.progress || project.progress}
                    onChange={e => setProgressForm(p => ({ ...p, progress: e.target.value }))}
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Work Status / Progress Notes</label>
                  <textarea
                    rows="3"
                    className="input text-sm resize-none"
                    placeholder="Describe what has been completed, any achievements or update details..."
                    value={progressForm.notes}
                    onChange={e => setProgressForm(p => ({ ...p, notes: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Blockers or Challenges (Optional)</label>
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder="Mention any issues, dependencies, or missing feedback..."
                    value={progressForm.blockers}
                    onChange={e => setProgressForm(p => ({ ...p, blockers: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Attach Deliverables / Reference Images</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/2 hover:bg-white/3"
                  >
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-white text-xs font-semibold">Select files to upload</p>
                    <p className="text-slate-500 text-[10px] mt-1">Image renders, references, fbx, blend, or zip archives</p>
                    <input
                      type="file"
                      ref={fileRef}
                      className="hidden"
                      multiple
                      onChange={e => setFiles(Array.from(e.target.files))}
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-slate-800/50 border border-white/5 rounded-lg px-3 py-2">
                          <span className="text-slate-300 truncate max-w-[80%]">{file.name}</span>
                          <span className="text-slate-500 text-[10px] font-mono shrink-0">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="submit"
                    disabled={progressMutation.isLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {progressMutation.isLoading ? 'Uploading...' : 'Save Update'}
                  </button>
                  
                  {project.status !== 'review' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to submit this project for final review?')) {
                          reviewMutation.mutate();
                        }
                      }}
                      disabled={reviewMutation.isLoading}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Submit Final Review
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="glass-card p-6 md:p-8 flex items-center gap-4 border border-yellow-500/20 bg-yellow-500/5 text-yellow-200">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              This project is assigned to <span className="font-semibold text-white">{project.assignedTo?.name || 'another employee'}</span>. 
              Only the assigned employee can download files, log progress, or upload final deliverables.
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
