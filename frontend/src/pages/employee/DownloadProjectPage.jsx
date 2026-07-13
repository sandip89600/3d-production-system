import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsAPI } from '../../api';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { Download, FileArchive, Clock, Calendar, CheckSquare, Shield, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DownloadProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getById(id).then(r => r.data.project),
    enabled: !!id,
  });

  const handleDownload = async () => {
    if (!project) return;
    setDownloading(true);
    const toastId = toast.loading('Generating secure download link...');
    try {
      const res = await projectsAPI.getSecureDownloadUrl(id);
      
      // Click-to-download link triggers standard browser download
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Layout title="Secure Download Portal">
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
      <Layout title="Secure Download Portal">
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

  return (
    <Layout title="Secure Download Portal" subtitle="Verify and download project assets safely">
      <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
        
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
            <p className="text-slate-400 text-sm line-clamp-2">{project.description || 'No description provided.'}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Deadline</p>
              <p className="text-white font-medium text-sm">
                {project.deadline ? format(new Date(project.deadline), 'dd MMMM yyyy') : '—'}
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
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">File Size</p>
              <p className="text-white font-medium text-sm">{formatFileSize(project.fileSize)}</p>
            </div>
          </div>
        </div>

        {/* Security Warning & Action */}
        <div className="glass-card p-6 md:p-8 text-center flex flex-col items-center">
          <div className="max-w-md mb-6">
            <h3 className="text-white font-semibold mb-2">Secure Download Link</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              This link is unique to your session. By downloading, you agree to track this download log under your name. Every access is logged, including user IP, browser details, and time.
            </p>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`w-full max-w-xs py-3.5 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/25 disabled:opacity-50`}
          >
            <Download className="w-5 h-5" />
            {downloading ? 'Downloading...' : 'Download Project Files'}
          </button>

          <p className="text-slate-500 text-xs mt-3">
            Filename: <span className="text-slate-400 font-mono">{project.fileName || '—'}</span>
          </p>
        </div>

      </div>
    </Layout>
  );
}
