import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api';
import Layout from '../../components/Layout';
import StatsCard from '../../components/StatsCard';
import { StatusBadge, PriorityBadge, ProgressBar } from '../../components/Badges';
import { Upload, FolderKanban, CheckCircle2, ClipboardList, AlertTriangle, Clock, Users } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsAPI.getAdminDashboard().then(r => r.data),
    refetchInterval: 30000,
  });

  const stats = data?.stats || {};
  const recentProjects = data?.recentProjects || [];
  const pendingReviews = data?.pendingReviews || [];

  return (
    <Layout title="Admin Dashboard" subtitle="Monitor your projects and team activity">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard title="Total Uploaded" value={stats.uploaded} icon={Upload} color="blue" />
        <StatsCard title="Active" value={stats.active} icon={FolderKanban} color="purple" />
        <StatsCard title="Completed" value={stats.completed} icon={CheckCircle2} color="emerald" />
        <StatsCard title="Pending Review" value={stats.inReview} icon={ClipboardList} color="amber" />
        <StatsCard title="Delayed" value={stats.delayed} icon={AlertTriangle} color="red" />
      </div>

      {/* Client Scope Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Clients" value={data?.clientStats?.totalClients} icon={Users} color="cyan" />
        <StatsCard title="Active Clients" value={data?.clientStats?.activeClients} icon={CheckCircle2} color="indigo" />
        <StatsCard title="Client Uploads" value={data?.clientStats?.clientUploadCount} icon={Upload} color="amber" />
        <StatsCard title="Client Projects" value={data?.clientStats?.clientProjectCount} icon={FolderKanban} color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Reviews */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Pending Reviews</h3>
            {pendingReviews.length > 0 && (
              <span className="badge bg-amber-500/20 text-amber-400">{pendingReviews.length}</span>
            )}
          </div>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p className="text-slate-400 text-sm">No pending reviews</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map(project => (
                <div key={project._id} onClick={() => navigate('/admin/review')} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl cursor-pointer hover:bg-amber-500/10 transition-colors">
                  <p className="text-white font-medium text-sm flex items-center gap-1.5 flex-wrap">
                    {project.projectId && <span className="font-mono text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                    <span>{project.name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-xs">{project.department?.name}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-400 text-xs">Submitted by {project.assignedTo?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pendingReviews.length > 0 && (
            <button onClick={() => navigate('/admin/review')} className="btn-primary w-full mt-4 text-sm">
              Review All ({pendingReviews.length})
            </button>
          )}
        </div>

        {/* Recent Projects */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Projects</h3>
            <button onClick={() => navigate('/admin/upload')} className="btn-primary py-1.5 text-sm flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map(project => {
                const isOverdue = project.deadline && isPast(new Date(project.deadline)) && project.status !== 'completed';
                const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null;
                return (
                  <div key={project._id} className="p-4 bg-white/3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {project.projectId && <span className="font-mono text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                          <p className="text-white font-semibold text-sm truncate">{project.name}</p>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{project.type} · {project.department?.name}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <ProgressBar progress={project.progress} size="sm" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-500 text-xs">
                        {project.assignedTo ? `👤 ${project.assignedTo.name}` : '🔓 Unassigned'}
                      </span>
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                        {isOverdue
                          ? `⚠️ Overdue ${Math.abs(daysLeft)}d`
                          : daysLeft !== null ? `📅 ${daysLeft}d left` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
              {recentProjects.length === 0 && (
                <div className="text-center py-8">
                  <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No projects yet</p>
                  <button onClick={() => navigate('/admin/upload')} className="btn-primary mt-3 text-sm">Upload First Project</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scoped Client Activity Grids */}
      <div className="glass-card p-6 mt-6">
        <h3 className="text-white font-semibold mb-1">Recent Client Activity</h3>
        <p className="text-slate-400 text-xs mb-4">Latest uploads from visualization clients</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/5">
                <th className="text-slate-400 font-medium pb-3 pr-4">Client</th>
                <th className="text-slate-400 font-medium pb-3 pr-4">Project</th>
                <th className="text-slate-400 font-medium pb-3 pr-4">File Name</th>
                <th className="text-slate-400 font-medium pb-3 pr-4">Size</th>
                <th className="text-slate-400 font-medium pb-3">Uploaded At</th>
              </tr>
            </thead>
            <tbody>
              {(data?.clientActivity || []).map((log, i) => (
                <tr key={i} className="table-row text-xs">
                  <td className="py-3 pr-4">
                    <p className="text-white font-medium">{log.userId?.name}</p>
                    <p className="text-slate-500">{log.userId?.companyName || '—'}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-300">{log.projectId?.name || '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-amber-400 font-mono">{log.fileId?.originalName || '—'}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {log.fileId?.fileSize ? `${(log.fileId.fileSize / (1024 * 1024)).toFixed(2)} MB` : '—'}
                  </td>
                  <td className="py-3 text-slate-400">
                    {log.uploadedAt ? format(new Date(log.uploadedAt), 'dd MMM hh:mm a') : '—'}
                  </td>
                </tr>
              ))}
              {!data?.clientActivity?.length && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">No client uploads tracked yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
