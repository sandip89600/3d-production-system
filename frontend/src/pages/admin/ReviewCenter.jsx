import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '../../api';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge, ProgressBar } from '../../components/Badges';
import { CheckCircle, XCircle, Search, MessageSquare, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${path}`;
};

export default function ReviewCenter() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [logsProject, setLogsProject] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'review'],
    queryFn: () => projectsAPI.getAll({ status: 'review' }).then(r => r.data),
    refetchInterval: 20000,
  });

  const { data: logsData } = useQuery({
    queryKey: ['progress-logs', logsProject],
    queryFn: () => projectsAPI.getProgressLogs(logsProject).then(r => r.data),
    enabled: !!logsProject,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }) => projectsAPI.approve(id, notes),
    onSuccess: () => {
      toast.success('Project approved! ✅');
      qc.invalidateQueries(['projects', 'review']);
      qc.invalidateQueries(['admin-dashboard']);
      setSelected(null);
      setNotes('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }) => projectsAPI.reject(id, notes),
    onSuccess: () => {
      toast.success('Revision requested 🔄');
      qc.invalidateQueries(['projects', 'review']);
      setSelected(null);
      setNotes('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const projects = data?.projects || [];

  return (
    <Layout title="Review Center" subtitle="Review and approve submitted work">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project List */}
        <div>
          <h3 className="text-white font-semibold mb-4">
            Projects Awaiting Review
            {projects.length > 0 && (
              <span className="ml-2 badge bg-amber-500/20 text-amber-400">{projects.length}</span>
            )}
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center h-48 glass-card">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <p className="text-white font-semibold">All caught up!</p>
              <p className="text-slate-400 text-sm">No projects waiting for review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(project => (
                <div
                  key={project._id}
                  onClick={() => { setSelected(project); setNotes(''); setLogsProject(project._id); }}
                  className={`glass-card p-4 cursor-pointer transition-all duration-200 hover:bg-white/8 ${selected?._id === project._id ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {project.projectId && <span className="font-mono text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                        <h4 className="text-white font-semibold text-sm">{project.name}</h4>
                      </div>
                      <p className="text-slate-400 text-xs">{project.type} · {project.department?.name}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <ProgressBar progress={project.progress} size="sm" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-400 text-xs">
                      👤 {project.assignedTo?.name || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={project.priority} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setLogsProject(project._id); setSelected(project); }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Panel */}
        <div>
          {selected ? (
            <div className="space-y-4">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">Review: {selected.name}</h3>

                {/* Project info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Employee', value: selected.assignedTo?.name },
                    { label: 'Progress', value: `${selected.progress}%` },
                    { label: 'Department', value: selected.department?.name },
                    { label: 'Priority', value: selected.priority?.toUpperCase() },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">{s.label}</p>
                      <p className="text-white font-semibold text-sm mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Project file */}
                {selected.fileName && (
                  <div className="mb-4 bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-400 text-xs font-medium mb-1">Project Brief File</p>
                    <a
                      href={getFileUrl(selected.fileUrl)}
                      download={selected.fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline text-xs font-semibold"
                    >
                      📎 {selected.fileName}
                    </a>
                  </div>
                )}

                {/* Progress Logs */}
                {logsData?.logs?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-xs font-medium mb-2">Progress History</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {logsData.logs.map(log => (
                        <div key={log._id} className="flex items-start gap-3 bg-white/3 rounded-lg p-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                            {log.day}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-white text-xs font-semibold">{log.progressPercentage}%</span>
                              <span className="text-slate-500 text-xs">{format(new Date(log.date), 'dd MMM')}</span>
                            </div>
                            {log.notes && <p className="text-slate-400 text-xs truncate mt-0.5">{log.notes}</p>}
                            {log.uploadedFiles?.length > 0 && (
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {log.uploadedFiles.map(f => (
                                  <a
                                    key={f.fileName}
                                    href={getFileUrl(f.fileUrl)}
                                    download={f.fileName}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md text-[10px] hover:underline flex items-center gap-1 transition-all"
                                  >
                                    📎 {f.fileName}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review notes */}
                <div className="mb-4">
                  <label className="label">Review Notes</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Add your review feedback..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => rejectMutation.mutate({ id: selected._id, notes })}
                    disabled={rejectMutation.isPending}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 text-amber-400 border-amber-500/30"
                  >
                    <XCircle className="w-4 h-4" />
                    Request Changes
                  </button>
                  <button
                    onClick={() => approveMutation.mutate({ id: selected._id, notes })}
                    disabled={approveMutation.isPending}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center h-full flex flex-col items-center justify-center">
              <Search className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400">Select a project from the list to review it</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
