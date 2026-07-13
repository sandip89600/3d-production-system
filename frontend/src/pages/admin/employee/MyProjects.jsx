import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI, projectsAPI } from '../../../api';
import Layout from '../../../components/Layout';
import { StatusBadge, PriorityBadge, ProgressBar } from '../../../components/Badges';
import { Send, Upload, FileText, TrendingUp, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${path}`;
};

export default function MyProjects() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [progressForm, setProgressForm] = useState({ progress: '', notes: '', blockers: '' });
  const [files, setFiles] = useState([]);
  const fileRef = useRef();

  const { data, isLoading } = useQuery({
    queryKey: ['employee-dashboard'],
    queryFn: () => analyticsAPI.getEmployeeDashboard().then(r => r.data),
  });

  const { data: logsData } = useQuery({
    queryKey: ['progress-logs', expanded],
    queryFn: () => projectsAPI.getProgressLogs(expanded).then(r => r.data),
    enabled: !!expanded,
  });

  const progressMutation = useMutation({
    mutationFn: ({ projectId, fd }) => projectsAPI.updateProgress(projectId, fd),
    onSuccess: () => {
      toast.success('Progress updated! 📊');
      qc.invalidateQueries(['employee-dashboard']);
      qc.invalidateQueries(['progress-logs', expanded]);
      setProgressForm({ progress: '', notes: '', blockers: '' });
      setFiles([]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const reviewMutation = useMutation({
    mutationFn: (projectId) => projectsAPI.submitForReview(projectId),
    onSuccess: () => {
      toast.success('Submitted for review! 🎉');
      qc.invalidateQueries(['employee-dashboard']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const handleProgressSubmit = (projectId, e) => {
    e.preventDefault();
    if (!progressForm.progress) { toast.error('Enter progress percentage'); return; }
    const fd = new FormData();
    fd.append('progress', progressForm.progress);
    fd.append('notes', progressForm.notes);
    fd.append('blockers', progressForm.blockers);
    files.forEach(f => fd.append('files', f));
    progressMutation.mutate({ projectId, fd });
  };

  const assignments = data?.assignments || [];

  return (
    <Layout title="My Projects" subtitle="Track and update your project progress">
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">No projects yet</p>
          <p className="text-slate-400 text-sm">Browse and pick up available projects to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(({ project, ...assignment }) => {
            if (!project) return null;
            const isExpanded = expanded === project._id;
            const logs = logsData?.logs || [];

            return (
              <div key={assignment._id} className="glass-card overflow-hidden">
                {/* Header row */}
                <div
                  className="p-5 cursor-pointer hover:bg-white/3 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : project._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {project.projectId && <span className="font-mono text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                          <h3 className="text-white font-bold text-sm">{project.name}</h3>
                          <StatusBadge status={assignment.status} />
                          <PriorityBadge priority={project.priority} />
                        </div>
                        <p className="text-slate-400 text-xs">{project.type} · {project.department?.name}</p>
                      </div>
                      <div className="w-48 flex-shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-xs">Day {assignment.totalDaysWorked}</span>
                          <span className="text-white text-xs font-bold">{assignment.progress}%</span>
                        </div>
                        <ProgressBar progress={assignment.progress} showLabel={false} />
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-5 animate-fade-in space-y-4">
                    {/* Project Description & Files */}
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-4">
                      <h4 className="text-white font-semibold text-sm mb-2">Project Brief & Assets</h4>
                      {project.description && <p className="text-slate-400 text-xs mb-3 leading-relaxed">{project.description}</p>}
                      {project.fileName ? (
                        <a
                          href={getFileUrl(project.fileUrl)}
                          download={project.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors cursor-pointer group"
                        >
                          <Upload className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                          <span className="text-blue-400 text-xs font-medium group-hover:underline truncate max-w-xs">{project.fileName}</span>
                        </a>
                      ) : (
                        <p className="text-slate-500 text-xs italic">No original file attached to this project brief</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Progress Log Timeline */}
                      <div>
                        <h4 className="text-white font-semibold mb-3 text-sm">Progress Timeline</h4>
                        {logs.length === 0 ? (
                          <p className="text-slate-500 text-sm">No progress logged yet</p>
                        ) : (
                          <div className="relative">
                            <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />
                            <div className="space-y-3">
                              {logs.map(log => (
                                <div key={log._id} className="flex gap-4 relative">
                                  <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-dark-900 flex items-center justify-center text-white text-xs font-bold z-10 flex-shrink-0">
                                    {log.day}
                                  </div>
                                  <div className="flex-1 pb-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-white font-semibold text-sm">{log.progressPercentage}%</span>
                                      <span className="text-slate-500 text-xs">{format(new Date(log.date), 'dd MMM yyyy')}</span>
                                    </div>
                                    {log.notes && <p className="text-slate-400 text-xs mb-1">{log.notes}</p>}
                                    {log.blockers && <p className="text-red-400 text-xs">⚠️ {log.blockers}</p>}
                                    {log.uploadedFiles?.length > 0 && (
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {log.uploadedFiles.map(f => (
                                          <a
                                            key={f.fileName}
                                            href={getFileUrl(f.fileUrl)}
                                            download={f.fileName}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md text-xs hover:bg-blue-500/30 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            {f.fileName}
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
                      </div>

                      {/* Update Progress Form */}
                      {['active', 'review'].includes(assignment.status) && (
                        <div>
                          <h4 className="text-white font-semibold mb-3 text-sm">Update Progress</h4>
                          <form onSubmit={(e) => handleProgressSubmit(project._id, e)} className="space-y-3">
                            <div>
                              <label className="label">Progress % (Day {(assignment.totalDaysWorked || 0) + 1})</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range" min={0} max={100} step={5}
                                  className="flex-1 accent-blue-500"
                                  value={progressForm.progress || assignment.progress}
                                  onChange={e => setProgressForm(f => ({ ...f, progress: e.target.value }))}
                                />
                                <span className="text-white font-bold w-10 text-center">
                                  {progressForm.progress || assignment.progress}%
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="label">Daily Notes</label>
                              <textarea
                                className="input resize-none text-sm"
                                rows={2}
                                placeholder="What did you work on today?"
                                value={progressForm.notes}
                                onChange={e => setProgressForm(f => ({ ...f, notes: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="label">Blockers (optional)</label>
                              <input
                                className="input text-sm"
                                placeholder="Any issues or blockers?"
                                value={progressForm.blockers}
                                onChange={e => setProgressForm(f => ({ ...f, blockers: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="label">Attach Files (optional)</label>
                              <div
                                onClick={() => fileRef.current?.click()}
                                className="border border-dashed border-white/10 rounded-xl p-3 text-center cursor-pointer hover:border-white/20 hover:bg-white/3 transition-all"
                              >
                                <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                                <p className="text-slate-400 text-xs">{files.length > 0 ? `${files.length} file(s) selected` : 'Click to attach'}</p>
                              </div>
                              <input ref={fileRef} type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
                            </div>
                            <div className="flex gap-2">
                              <button type="submit" disabled={progressMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4" />
                                {progressMutation.isPending ? 'Saving...' : 'Update Progress'}
                              </button>
                              {assignment.progress >= 90 && assignment.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => reviewMutation.mutate(project._id)}
                                  disabled={reviewMutation.isPending}
                                  className="btn-success flex items-center gap-1.5 text-sm"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Submit
                                </button>
                              )}
                            </div>
                          </form>
                        </div>
                      )}

                      {assignment.status === 'completed' && (
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-3xl">🎉</span>
                            </div>
                            <p className="text-emerald-400 font-bold">Completed!</p>
                            <p className="text-slate-400 text-xs mt-1">Great work on this project</p>
                            {project.reviewNotes && (
                              <div className="mt-3 p-3 bg-white/5 rounded-xl text-left">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-blue-400 text-xs font-medium">Admin Notes</span>
                                </div>
                                <p className="text-slate-300 text-xs">{project.reviewNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
