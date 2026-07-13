import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../../api';
import Layout from '../../../components/Layout';
import StatsCard from '../../../components/StatsCard';
import { StatusBadge, PriorityBadge, ProgressBar } from '../../../components/Badges';
import {
  FolderKanban, Users, Building2, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Activity, Layers, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-900 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-white text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-overview'],
    queryFn: () => analyticsAPI.getOverview().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: adminPerf } = useQuery({
    queryKey: ['admin-performance'],
    queryFn: () => analyticsAPI.getAdminPerformance().then(r => r.data),
  });

  const overview = data?.overview || {};
  const monthlyTrend = (data?.monthlyTrend || []).map(m => ({
    name: `${m._id.month}/${m._id.year}`,
    Uploaded: m.uploaded,
    Completed: m.completed,
  }));

  const pieData = (data?.statusBreakdown || []).map(s => ({
    name: s._id?.charAt(0).toUpperCase() + s._id?.slice(1),
    value: s.count,
  }));

  const deptChartData = (data?.deptStats || []).map(d => ({
    name: d.name,
    Total: d.count,
    Completed: d.completed,
    Pending: d.count - d.completed,
  }));

  if (isLoading) {
    return (
      <Layout title="Super Admin Dashboard" subtitle="Full system overview">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Super Admin Dashboard" subtitle="Complete system overview & analytics">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Projects" value={overview.totalProjects} icon={FolderKanban} color="blue" />
        <StatsCard title="Active Projects" value={overview.activeProjects} icon={Activity} color="purple" />
        <StatsCard title="Completed" value={overview.completedProjects} icon={CheckCircle2} color="emerald" />
        <StatsCard title="Delayed" value={overview.delayedProjects} icon={AlertTriangle} color="red" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Users" value={overview.totalUsers} icon={Users} color="cyan" />
        <StatsCard title="Employees" value={overview.totalEmployees} icon={Layers} color="indigo" />
        <StatsCard title="Admins" value={overview.totalAdmins} icon={Zap} color="amber" />
        <StatsCard title="Departments" value={overview.totalDepartments} icon={Building2} color="pink" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-white font-semibold mb-1">Project Activity Trend</h3>
          <p className="text-slate-400 text-xs mb-6">Monthly uploads vs completions</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorUploaded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
              <Area type="monotone" dataKey="Uploaded" stroke="#3B82F6" fill="url(#colorUploaded)" strokeWidth={2} />
              <Area type="monotone" dataKey="Completed" stroke="#10B981" fill="url(#colorCompleted)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-1">Project Status</h3>
          <p className="text-slate-400 text-xs mb-6">Current distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-400 text-xs">{entry.name}</span>
                </div>
                <span className="text-white text-xs font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Performance + Admin Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Department Bar Chart */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-1">Department Performance</h3>
          <p className="text-slate-400 text-xs mb-6">Projects by department</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptChartData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
              <Bar dataKey="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Admin Performance Table */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-1">Admin Performance</h3>
          <p className="text-slate-400 text-xs mb-4">Project upload & completion rates</p>
          <div className="space-y-3">
            {(adminPerf?.adminStats || []).map((admin, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {admin.adminCode || admin.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm font-medium truncate">{admin.name}</p>
                    <span className="text-emerald-400 text-xs font-semibold">{Math.round(admin.completionRate)}%</span>
                  </div>
                  <ProgressBar progress={Math.round(admin.completionRate)} showLabel={false} size="sm" />
                  <p className="text-slate-500 text-xs mt-1">{admin.totalUploaded} uploaded · {admin.completed} completed · {admin.delayed} delayed</p>
                </div>
              </div>
            ))}
            {!adminPerf?.adminStats?.length && (
              <p className="text-slate-500 text-sm text-center py-4">No admin data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Recent Projects</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/5">
                <th className="text-slate-400 font-medium pb-3 pr-4">Project</th>
                <th className="text-slate-400 font-medium pb-3 pr-4">Department</th>
                <th className="text-slate-400 font-medium pb-3 pr-4">Uploaded By</th>
                <th className="text-slate-400 font-medium pb-3 pr-4">Status</th>
                <th className="text-slate-400 font-medium pb-3 pr-4">Progress</th>
                <th className="text-slate-400 font-medium pb-3">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentProjects || []).map(p => (
                <tr key={p._id} className="table-row">
                  <td className="py-3 pr-4">
                    <p className="text-white font-medium">{p.name}</p>
                    <p className="text-slate-500 text-xs">{p.type}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-300 text-xs">{p.department?.name}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-300 text-xs">{p.uploadedBy?.adminCode || p.uploadedBy?.name}</span>
                  </td>
                  <td className="py-3 pr-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 pr-4 w-32"><ProgressBar progress={p.progress} size="sm" /></td>
                  <td className="py-3 text-slate-400 text-xs">
                    {p.deadline ? format(new Date(p.deadline), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
              {!data?.recentProjects?.length && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">No projects yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
