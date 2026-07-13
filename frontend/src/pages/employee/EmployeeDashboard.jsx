import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api';
import Layout from '../../components/Layout';
import StatsCard from '../../components/StatsCard';
import { StatusBadge, PriorityBadge, ProgressBar } from '../../components/Badges';
import { FolderKanban, CheckCircle2, Activity, ClipboardList, ArrowRight } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['employee-dashboard'],
    queryFn: () => analyticsAPI.getEmployeeDashboard().then(r => r.data),
    refetchInterval: 30000,
  });

  const stats = data?.stats || {};
  const assignments = data?.assignments || [];
  const activeAssignments = assignments.filter(a => a.status === 'active');
  const recentDone = assignments.filter(a => a.status === 'completed').slice(0, 3);

  return (
    <Layout
      title={`Welcome back, ${user?.name?.split(' ')[0]}! 👋`}
      subtitle="Your project workbench"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Projects" value={stats.total} icon={FolderKanban} color="blue" />
        <StatsCard title="Active" value={stats.active} icon={Activity} color="purple" />
        <StatsCard title="In Review" value={stats.inReview} icon={ClipboardList} color="amber" />
        <StatsCard title="Completed" value={stats.completed} icon={CheckCircle2} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Active Projects</h3>
            <button onClick={() => navigate('/employee/available')} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5">
              Browse More <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : activeAssignments.length === 0 ? (
            <div className="text-center py-10">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium">No active projects</p>
              <p className="text-slate-400 text-sm mb-4">Browse available projects to get started</p>
              <button onClick={() => navigate('/employee/available')} className="btn-primary">Browse Projects</button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map(({ project, ...assignment }) => {
                if (!project) return null;
                const isOverdue = project.deadline && isPast(new Date(project.deadline));
                const daysLeft = project.deadline ? differenceInDays(new Date(project.deadline), new Date()) : null;
                return (
                  <div key={assignment._id} onClick={() => navigate('/employee/my-projects')} className="p-4 bg-white/3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {project.projectId && <span className="font-mono text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                          <h4 className="text-white font-semibold">{project.name}</h4>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{project.type} · {project.department?.name}</p>
                      </div>
                      <PriorityBadge priority={project.priority} />
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-xs">Day {assignment.totalDaysWorked} progress</span>
                        <span className="text-white text-xs font-semibold">{assignment.progress}%</span>
                      </div>
                      <ProgressBar progress={assignment.progress} showLabel={false} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs">
                        Uploaded by {project.uploadedBy?.adminCode || project.uploadedBy?.name}
                      </span>
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : daysLeft <= 2 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {isOverdue
                          ? `⚠️ ${Math.abs(daysLeft)}d overdue`
                          : daysLeft !== null ? `📅 ${daysLeft}d left` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Completed */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4">Recently Completed</h3>
            {recentDone.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No completed projects yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDone.map(({ project, completedDate }) => (
                  <div key={project?._id} className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {project?.projectId && <span className="font-mono text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                        <p className="text-white text-sm font-medium truncate">{project?.name}</p>
                      </div>
                      <p className="text-slate-500 text-xs">{completedDate ? format(new Date(completedDate), 'dd MMM') : 'Done'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick tips */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-3">📋 Daily Checklist</h3>
            <div className="space-y-2">
              {[
                { task: 'Update project progress', done: activeAssignments.length > 0 && activeAssignments.some(a => a.progress > 0) },
                { task: 'Check for new projects', done: false },
                { task: 'Review admin feedback', done: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${item.done ? 'bg-emerald-500/10' : 'bg-white/3'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                    {item.done && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={item.done ? 'text-emerald-400' : 'text-slate-400'}>{item.task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
