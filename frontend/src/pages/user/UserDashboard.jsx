import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI, projectsAPI } from '../../api';
import Layout from '../../components/Layout';
import StatsCard from '../../components/StatsCard';
import { StatusBadge, ProgressBar } from '../../components/Badges';
import { Upload, FolderKanban, CheckCircle2, Clock, AlertTriangle, FileText, Bell, Sparkles, Send, Download } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const queryClient = useQueryClient();
  const [briefForm, setBriefForm] = useState({ name: '', type: '3D architecture', description: '', priority: 'medium', deadline: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Client Dashboard Stats & Activity
  const { data, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: () => analyticsAPI.getClientDashboard().then(r => r.data),
    refetchInterval: 30000,
  });

  const stats = data?.stats || {};
  const recentProjects = data?.recentProjects || [];
  const uploadedFiles = data?.uploadedFiles || [];
  const recentNotifications = data?.recentNotifications || [];

  // 2. Project Types mapping to auto-assign departments in backend
  const projectTypes = ['3D architecture', 'Modeling', 'rendering', 'VFX', 'Other'];

  // 3. Mutation to Submit a New Visual Brief / Project File
  const createProjectMutation = useMutation({
    mutationFn: (formData) => projectsAPI.create(formData),
    onSuccess: () => {
      toast.success('Project brief submitted successfully! Assigned to production department.');
      setBriefForm({ name: '', type: '3D architecture', description: '', priority: 'medium', deadline: '' });
      setFile(null);
      // Reset file input element
      const fileInput = document.getElementById('brief-file');
      if (fileInput) fileInput.value = '';
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit brief.');
    }
  });

  const handleBriefSubmit = async (e) => {
    e.preventDefault();
    if (!briefForm.name || !briefForm.deadline) {
      toast.error('Project Name and Deadline are required.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', briefForm.name);
    formData.append('type', briefForm.type);
    formData.append('description', briefForm.description);
    formData.append('priority', briefForm.priority);
    formData.append('deadline', briefForm.deadline);
    if (file) {
      formData.append('file', file);
    }

    try {
      await createProjectMutation.mutateAsync(formData);
    } catch (err) {
      // handled by mutation onError
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Download Deliverable Handler (triggers secure signed URL generation)
  const handleDownload = async (projectId, fileName) => {
    const downloadToast = toast.loading('Generating secure download link...');
    try {
      const res = await projectsAPI.getSecureDownloadUrl(projectId);
      if (res.data?.downloadUrl) {
        toast.success('Download link generated!', { id: downloadToast });
        window.open(res.data.downloadUrl, '_blank');
      } else {
        toast.error('Failed to get download URL.', { id: downloadToast });
      }
    } catch (err) {
      toast.error('Error generating download link.', { id: downloadToast });
    }
  };

  return (
    <Layout title="Client Workspace" subtitle="Create visualization briefs, track drafts, and download final high-definition renders">
      
      {/* Overview stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard title="My Total Projects" value={stats.totalProjects} icon={FolderKanban} color="blue" />
        <StatsCard title="Completed Projects" value={stats.completedProjects} icon={CheckCircle2} color="emerald" />
        <StatsCard title="Pending Review" value={stats.pendingProjects} icon={Clock} color="amber" />
        <StatsCard title="Delayed Renders" value={stats.delayedProjects} icon={AlertTriangle} color="red" />
        <StatsCard title="Uploaded Assets" value={stats.uploadedFilesCount} icon={FileText} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Submit brief form */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-white font-semibold text-lg">New Visual Brief</h3>
            </div>
            <form onSubmit={handleBriefSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Villa Living Room"
                  value={briefForm.name}
                  onChange={e => setBriefForm({ ...briefForm, name: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400">Visualization Type</label>
                <select
                  value={briefForm.type}
                  onChange={e => setBriefForm({ ...briefForm, type: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {projectTypes.map(t => (
                    <option key={t} value={t} className="bg-slate-950 capitalize">{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400">Brief Description</label>
                <textarea
                  placeholder="Describe your design specifications, reference styles, lighting, color palette, and textures..."
                  rows={3}
                  value={briefForm.description}
                  onChange={e => setBriefForm({ ...briefForm, description: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-400">Priority</label>
                  <select
                    value={briefForm.priority}
                    onChange={e => setBriefForm({ ...briefForm, priority: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-400">Deadline</label>
                  <input
                    type="date"
                    required
                    value={briefForm.deadline}
                    onChange={e => setBriefForm({ ...briefForm, deadline: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400">CAD Blueprint / Reference File</label>
                <input
                  type="file"
                  id="brief-file"
                  onChange={e => setFile(e.target.files[0])}
                  className="text-xs text-slate-400 bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 file:bg-amber-500 file:border-none file:text-slate-950 file:px-2.5 file:py-1 file:rounded-lg file:font-semibold file:cursor-pointer hover:file:bg-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Project Brief</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Client Projects list */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-white font-semibold text-lg mb-4">My Renders & Projects</h3>
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {recentProjects.map(project => {
              const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null;
              return (
                <div key={project._id} className="p-4 bg-white/3 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {project.projectId && <span className="font-mono text-[9px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                        <p className="text-white font-semibold text-sm">{project.name}</p>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 capitalize">{project.type} · {project.department?.name || 'Assigned to Production'}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <ProgressBar progress={project.progress} size="sm" />
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-slate-400">
                      {project.assignedTo ? `Assigned to: ${project.assignedTo.name}` : 'Awaiting production pickup'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-450 font-medium">
                        {daysLeft !== null ? (daysLeft >= 0 ? `📅 ${daysLeft}d remaining` : `⚠️ Overdue ${Math.abs(daysLeft)}d`) : ''}
                      </span>
                      {project.status === 'completed' && project.fileName && (
                        <button
                          onClick={() => handleDownload(project._id, project.fileName)}
                          className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Final</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {recentProjects.length === 0 && (
              <div className="text-center py-12">
                <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-slate-400 text-sm">No design projects submitted yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Uploaded Files grid */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Uploaded Blueprints & Assets</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/5">
                  <th className="text-slate-400 font-medium pb-3 pr-4">File Name</th>
                  <th className="text-slate-400 font-medium pb-3 pr-4">Scope Folder</th>
                  <th className="text-slate-400 font-medium pb-3 pr-4">File Size</th>
                  <th className="text-slate-400 font-medium pb-3">Uploaded At</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map(file => (
                  <tr key={file._id} className="table-row text-xs">
                    <td className="py-3 pr-4 font-mono text-amber-400">{file.originalName}</td>
                    <td className="py-3 pr-4 capitalize text-slate-300">{file.folder}</td>
                    <td className="py-3 pr-4 text-slate-450">{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</td>
                    <td className="py-3 text-slate-450">{format(new Date(file.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
                {uploadedFiles.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-500">No assets uploaded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold text-lg">Project Updates</h3>
            </div>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {recentNotifications.map(notification => (
              <div key={notification._id} className="p-3 bg-white/3 rounded-xl border border-white/5 text-xs">
                <p className="text-white font-medium mb-1">{notification.title || 'Notification'}</p>
                <p className="text-slate-400">{notification.message}</p>
                <p className="text-slate-500 text-[10px] mt-1">{format(new Date(notification.createdAt), 'dd MMM hh:mm a')}</p>
              </div>
            ))}
            {recentNotifications.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No project notifications yet</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
