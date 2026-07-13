import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsAPI, usersAPI } from '../../api';
import Layout from '../../components/Layout';
import { StatusBadge, ProgressBar } from '../../components/Badges';
import { Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeMonitor() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: empData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersAPI.getEmployees().then(r => r.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['all-projects-monitor'],
    queryFn: () => projectsAPI.getAll({ status: 'in-progress', limit: 50 }).then(r => r.data),
  });

  const { data: logsData } = useQuery({
    queryKey: ['logs', selected],
    queryFn: () => projectsAPI.getProgressLogs(selected).then(r => r.data),
    enabled: !!selected,
  });

  const projects = (projectsData?.projects || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Employee Monitor" subtitle="Track employee progress on active projects">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-10" placeholder="Search by project or employee..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-300 text-sm">{projects.length} active projects</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Project list */}
        <div className="lg:col-span-3 space-y-3">
          {projects.map(project => (
            <div
              key={project._id}
              onClick={() => setSelected(selected === project._id ? null : project._id)}
              className={`glass-card p-4 cursor-pointer transition-all duration-200 hover:bg-white/8 ${selected === project._id ? 'ring-1 ring-blue-500/50' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {project.projectId && <span className="font-mono text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{project.projectId}</span>}
                    <h3 className="text-white font-semibold text-sm">{project.name}</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{project.type} · {project.department?.name}</p>
                </div>
                <StatusBadge status={project.status} />
              </div>
              <ProgressBar progress={project.progress} size="sm" />
              <div className="flex items-center justify-between mt-2">
                {project.assignedTo ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                      {project.assignedTo.name?.charAt(0)}
                    </div>
                    <span className="text-slate-300 text-xs">{project.assignedTo.name}</span>
                  </div>
                ) : <span className="text-slate-500 text-xs">Unassigned</span>}
                <span className="text-slate-500 text-xs">
                  {project.deadline ? `📅 ${format(new Date(project.deadline), 'dd MMM')}` : ''}
                </span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No active projects to monitor</p>
            </div>
          )}
        </div>

        {/* Log viewer */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5 sticky top-6">
            <h3 className="text-white font-semibold mb-4">Progress Log</h3>
            {!selected ? (
              <div className="text-center py-8">
                <Eye className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Select a project to view logs</p>
              </div>
            ) : (logsData?.logs?.length || 0) === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No progress logged yet</p>
            ) : (
              <div className="space-y-3">
                {logsData.logs.map(log => (
                  <div key={log._id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">D{log.day}</div>
                    <div className="flex-1 bg-white/3 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold">{log.progressPercentage}%</span>
                        <span className="text-slate-500 text-xs">{format(new Date(log.date), 'dd MMM')}</span>
                      </div>
                      {log.notes && <p className="text-slate-400 text-xs mt-1">{log.notes}</p>}
                      {log.blockers && <p className="text-red-400 text-xs mt-1">⚠️ {log.blockers}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
