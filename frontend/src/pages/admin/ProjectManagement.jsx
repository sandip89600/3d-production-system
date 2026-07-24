import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsAPI, usersAPI } from '../../api';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge, ProgressBar } from '../../components/Badges';
import { Search, Filter, User, Calendar, ClipboardList, X } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

export default function ProjectManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeLogsProject, setActiveLogsProject] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects', statusFilter],
    queryFn: () => projectsAPI.getAll({ ...(statusFilter ? { status: statusFilter } : {}), limit: 50 }).then(r => r.data),
  });

  const { data: logData, isLoading: logsLoading } = useQuery({
    queryKey: ['download-logs', activeLogsProject?._id],
    queryFn: () => projectsAPI.getDownloadLogs(activeLogsProject._id).then(r => r.data),
    enabled: !!activeLogsProject,
  });

  const projects = (data?.projects || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Project Management" subtitle="All projects you have uploaded">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-10" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['available', 'in-progress', 'review', 'completed', 'delayed'].map(s => (
            <option key={s} value={s}>{s.replace('-', ' ')}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Project', 'Department', 'Assigned To', 'Priority', 'Status', 'Progress', 'Deadline', 'Tracking'].map(h => (
                    <th key={h} className="text-left text-slate-400 font-medium px-5 py-4 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const isOverdue = p.deadline && isPast(new Date(p.deadline)) && p.status !== 'completed';
                  const daysLeft = p.deadline ? differenceInDays(new Date(p.deadline), new Date()) : null;
                  return (
                    <tr key={p._id} className="table-row">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.projectId && <span className="font-mono text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{p.projectId}</span>}
                          <p className="text-white font-semibold">{p.name}</p>
                        </div>
                        <p className="text-slate-500 text-xs">{p.type}{p.clientName ? ` · ${p.clientName}` : ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-slate-300 text-xs">{p.department?.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        {p.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                              {p.assignedTo.name?.charAt(0)}
                            </div>
                            <span className="text-slate-300 text-xs">{p.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4"><PriorityBadge priority={p.priority} /></td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-4 w-36"><ProgressBar progress={p.progress} size="sm" /></td>
                      <td className="px-5 py-4">
                        {p.deadline ? (
                          <div>
                            <p className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                              {format(new Date(p.deadline), 'dd MMM yyyy')}
                            </p>
                            <p className={`text-xs ${isOverdue ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                              {isOverdue ? `⚠️ ${Math.abs(daysLeft)}d overdue` : daysLeft !== null ? `${daysLeft}d left` : ''}
                            </p>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setActiveLogsProject(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Download Logs"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-500">No projects found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Download Logs Modal */}
      {activeLogsProject && (() => {
        const logs = logData?.logs || [];
        const stats = logData?.stats || {};
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-card max-w-2xl w-full p-6 md:p-8 flex flex-col max-h-[85vh] relative animate-scale-in">
              <button 
                onClick={() => setActiveLogsProject(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-white font-bold text-lg mb-1">Project Workflow & Download Logs</h3>
              <p className="text-slate-400 text-xs mb-4">
                Project: <span className="text-slate-300 font-semibold">{activeLogsProject.name} ({activeLogsProject.projectId})</span>
              </p>

              {/* Status Tracking Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Uploaded</p>
                  <span className="text-emerald-400 font-bold text-sm">✔ Yes</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">WhatsApp</p>
                  <span className={stats.whatsappSent ? "text-emerald-400 font-bold text-sm" : "text-amber-400 font-bold text-sm"}>
                    {stats.whatsappSent ? "✔ Sent" : "Pending"}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Delivered</p>
                  <span className={stats.whatsappDelivered ? "text-emerald-400 font-bold text-sm" : "text-amber-400 font-bold text-sm"}>
                    {stats.whatsappDelivered ? "✔ Yes" : stats.whatsappSent ? "Sent" : "Pending"}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Downloaded</p>
                  <span className="text-blue-400 font-bold text-sm">{stats.downloadedCount || 0} Emp</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Remaining</p>
                  <span className={stats.remainingCount > 0 ? "text-amber-400 font-bold text-sm" : "text-emerald-400 font-bold text-sm"}>
                    {stats.remainingCount || 0} Emp
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {logsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Pending Downloads (if any) */}
                    {stats.pendingEmployees && stats.pendingEmployees.length > 0 && (
                      <div>
                        <h4 className="text-white font-bold text-xs mb-2 text-amber-400 uppercase tracking-wider">Pending Downloads ({stats.pendingEmployees.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {stats.pendingEmployees.map((emp, i) => (
                            <span key={i} className="text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-1 rounded-lg" title={emp.email}>
                              {emp.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Access Log Table */}
                    <div>
                      <h4 className="text-white font-bold text-xs mb-3 text-blue-400 uppercase tracking-wider">Download History</h4>
                      {!logs || logs.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-sm bg-white/3 rounded-xl border border-white/5">
                          No download records found for this project.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-white/5 pb-2 text-slate-400">
                                <th className="pb-3 font-semibold">User</th>
                                <th className="pb-3 font-semibold">Date & Time</th>
                                <th className="pb-3 font-semibold">IP Address</th>
                                <th className="pb-3 font-semibold">Device</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-[11px]">
                              {logs.map((log) => (
                                <tr key={log._id} className="text-slate-300">
                                  <td className="py-3 pr-4">
                                    <p className="font-semibold text-white">{log.employee?.name || 'Unknown'}</p>
                                    <p className="text-slate-500 text-[10px]">{log.employee?.email}</p>
                                  </td>
                                  <td className="py-3 pr-4 whitespace-nowrap">
                                    {format(new Date(log.downloadedAt), 'dd MMM yyyy, hh:mm a')}
                                  </td>
                                  <td className="py-3 pr-4 font-mono text-[10px]">
                                    {log.ipAddress || '—'}
                                  </td>
                                  <td className="py-3 text-[10px] text-slate-400 max-w-[180px] truncate" title={log.userAgent}>
                                    {log.userAgent || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setActiveLogsProject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                >
                  Close Logs
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
}
