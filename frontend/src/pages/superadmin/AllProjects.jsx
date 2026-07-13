import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI, departmentsAPI } from '../../api';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge, ProgressBar } from '../../components/Badges';
import { Search, Filter, Trash2 } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import toast from 'react-hot-toast';

export default function AllProjects() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['all-projects', page, statusFilter, deptFilter, priorityFilter],
    queryFn: () => projectsAPI.getAll({ page, limit: 15, ...(statusFilter ? { status: statusFilter } : {}), ...(deptFilter ? { department: deptFilter } : {}), ...(priorityFilter ? { priority: priorityFilter } : {}) }).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => departmentsAPI.getAll().then(r => r.data) });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsAPI.delete(id),
    onSuccess: (data) => {
      toast.success(data.message || 'Project deleted successfully');
      qc.invalidateQueries(['all-projects']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete project'),
  });

  const handleDelete = (project) => {
    if (window.confirm(`Are you sure you want to permanently delete the project "${project.name}"? This action cannot be undone and will permanently remove all associated progress logs and assignments.`)) {
      deleteMutation.mutate(project._id);
    }
  };

  const projects = (data?.projects || []).filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="All Projects" subtitle="System-wide project overview">
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-10" placeholder="Search projects..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          {['available', 'in-progress', 'review', 'completed', 'delayed'].map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
        </select>
        <select className="input w-48" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All departments</option>
          {(deptData?.departments || []).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="input w-36" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">All priority</option>
          {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Project', 'Department', 'Uploaded By', 'Assigned To', 'Priority', 'Status', 'Progress', 'Deadline', 'Actions'].map(h => (
                    <th key={h} className="text-left text-slate-400 font-medium px-4 py-4 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const overdue = p.deadline && isPast(new Date(p.deadline)) && p.status !== 'completed';
                  const daysLeft = p.deadline ? differenceInDays(new Date(p.deadline), new Date()) : null;
                  return (
                    <tr key={p._id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.projectId && <span className="font-mono text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">{p.projectId}</span>}
                          <p className="text-white font-semibold">{p.name}</p>
                        </div>
                        <p className="text-slate-500 text-xs">{p.type}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-slate-300 text-xs">{p.department?.name}</span></td>
                      <td className="px-4 py-3">
                        {p.uploadedBy ? (
                          <span className="badge bg-blue-500/20 text-blue-400 text-xs">{p.uploadedBy.adminCode || p.uploadedBy.name}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {p.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center text-white text-xs">{p.assignedTo.name?.charAt(0)}</div>
                            <span className="text-slate-300 text-xs">{p.assignedTo.name}</span>
                          </div>
                        ) : <span className="text-slate-500 text-xs">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={p.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 w-32"><ProgressBar progress={p.progress} size="sm" /></td>
                      <td className="px-4 py-3">
                        {p.deadline && (
                          <div>
                            <p className={`text-xs ${overdue ? 'text-red-400' : 'text-slate-300'}`}>{format(new Date(p.deadline), 'dd MMM yyyy')}</p>
                            {overdue && <p className="text-red-400 text-xs">⚠️ {Math.abs(daysLeft)}d overdue</p>}
                            {!overdue && daysLeft !== null && daysLeft <= 3 && <p className="text-amber-400 text-xs">⏰ {daysLeft}d left</p>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(p)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr><td colSpan={9} className="py-12 text-center text-slate-500">No projects found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-50">Previous</button>
          <span className="text-slate-400 text-sm">Page {page} of {data.totalPages} · {data.total} total</span>
          <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-50">Next</button>
        </div>
      )}
    </Layout>
  );
}
