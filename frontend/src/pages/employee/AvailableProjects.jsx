import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '../../api';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge, ProgressBar } from '../../components/Badges';
import { Search, Layers, Calendar, User, Download, CheckCircle } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${path}`;
};

export default function AvailableProjects() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [picked, setPicked] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['available-projects'],
    queryFn: () => projectsAPI.getAll({ status: 'available', limit: 50 }).then(r => r.data),
    refetchInterval: 15000,
  });

  const pickupMutation = useMutation({
    mutationFn: (id) => projectsAPI.pickup(id),
    onSuccess: (_, id) => {
      toast.success('Project picked up! Good luck! 🚀');
      qc.invalidateQueries(['available-projects']);
      qc.invalidateQueries(['employee-dashboard']);
      setPicked(id);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error picking up project'),
  });

  const projects = (data?.projects || []).filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter && p.department?._id !== deptFilter) return false;
    if (priorityFilter && p.priority !== priorityFilter) return false;
    return true;
  });

  const departments = [...new Set((data?.projects || []).map(p => JSON.stringify({ id: p.department?._id, name: p.department?.name })))].map(s => JSON.parse(s));

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...projects].sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

  return (
    <Layout title="Available Projects" subtitle="Browse and pick projects to work on">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-10" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-40" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      <p className="text-slate-400 text-sm mb-4">{sorted.length} projects available</p>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">No projects available</p>
          <p className="text-slate-400 text-sm">Check back later for new projects</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(project => {
            const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null;
            const isOverdue = daysLeft !== null && daysLeft < 0;
            const isUrgent = daysLeft !== null && daysLeft <= 3 && !isOverdue;
            const justPicked = picked === project._id;

            return (
              <div key={project._id} className={`glass-card p-5 flex flex-col transition-all duration-300 ${project.priority === 'critical' ? 'ring-1 ring-red-500/30' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {project.projectId && <span className="font-mono text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                      <h3 className="text-white font-bold text-sm line-clamp-2">{project.name}</h3>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{project.type}</p>
                  </div>
                  <PriorityBadge priority={project.priority} />
                </div>

                {/* Department */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{project.department?.icon || '🏢'}</span>
                  <span className="text-slate-300 text-xs">{project.department?.name}</span>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400 text-xs">Uploaded by</span>
                    </div>
                    <p className="text-white text-xs font-semibold">{project.uploadedBy?.adminCode || project.uploadedBy?.name}</p>
                  </div>
                  <div className={`bg-white/5 rounded-lg p-2 ${isOverdue ? 'bg-red-500/10' : isUrgent ? 'bg-amber-500/10' : ''}`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400 text-xs">Deadline</span>
                    </div>
                    <p className={`text-xs font-semibold ${isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white'}`}>
                      {project.deadline ? format(new Date(project.deadline), 'dd MMM') : 'No deadline'}
                    </p>
                  </div>
                </div>

                {project.estimatedDays && (
                  <p className="text-slate-500 text-xs mb-3">⏱️ Est. {project.estimatedDays} days · {project.clientName || 'Internal'}</p>
                )}

                {/* File info */}
                {project.fileName && (
                  <a
                    href={getFileUrl(project.fileUrl)}
                    download={project.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 mb-3 p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-blue-400 text-xs truncate font-medium group-hover:underline">{project.fileName}</span>
                  </a>
                )}

                {/* Tags */}
                {project.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-white/5 rounded-md text-slate-400 text-xs">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Pick up button */}
                <div className="mt-auto pt-3">
                  {justPicked ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Picked Up!
                    </div>
                  ) : (
                    <button
                      onClick={() => pickupMutation.mutate(project._id)}
                      disabled={pickupMutation.isPending}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
                    >
                      {pickupMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        '🤚 Pick Up Project'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
