import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api';
import Layout from '../../components/Layout';
import { ProgressBar } from '../../components/Badges';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-900 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="text-sm font-medium">{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { data: empPerf } = useQuery({
    queryKey: ['employee-performance'],
    queryFn: () => analyticsAPI.getEmployeePerformance().then(r => r.data),
  });

  const { data: deptPerf } = useQuery({
    queryKey: ['department-performance'],
    queryFn: () => analyticsAPI.getDepartmentPerformance().then(r => r.data),
  });

  const empChartData = (empPerf?.employeeStats || []).slice(0, 8).map(e => ({
    name: e.name?.split(' ')[0] || 'N/A',
    Completed: e.completed,
    Active: e.active,
    'Avg Progress': e.avgProgress,
  }));

  const deptRadarData = (deptPerf?.deptPerf || []).map(d => ({
    dept: d.code,
    'Completion Rate': d.completionRate,
    'Productivity': d.productivityScore,
    'Avg Progress': d.avgProgress,
  }));

  return (
    <Layout title="Analytics" subtitle="Performance insights across admins, employees, and departments">
      {/* Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-1">Department Productivity</h3>
          <p className="text-slate-400 text-xs mb-4">Radar comparison across departments</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={deptRadarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="dept" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 9 }} />
              <Radar name="Completion %" dataKey="Completion Rate" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
              <Radar name="Productivity" dataKey="Productivity" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
              <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Department table */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Department Stats</h3>
          <div className="space-y-3">
            {(deptPerf?.deptPerf || []).map((dept, i) => (
              <div key={dept._id || i} className="p-3 bg-white/3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{dept.icon || '🏢'}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{dept.name}</p>
                      <p className="text-slate-500 text-xs">{dept.total} projects</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-sm">{dept.completionRate}%</p>
                    <p className="text-slate-500 text-xs">completion</p>
                  </div>
                </div>
                <ProgressBar progress={dept.completionRate} size="sm" showLabel={false} />
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-slate-500 text-xs">✅ {dept.completed} done</span>
                  <span className="text-slate-500 text-xs">⏳ {dept.active} active</span>
                  <span className="text-slate-500 text-xs">⚠️ {dept.delayed} delayed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Performance */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-white font-semibold mb-1">Employee Performance</h3>
        <p className="text-slate-400 text-xs mb-6">Completed vs active projects per employee</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={empChartData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
            <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Active" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Employee Table */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Employee Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/5">
                {['#', 'Employee', 'Total', 'Completed', 'Active', 'Avg Days', 'Avg Progress', 'Rate'].map(h => (
                  <th key={h} className="text-slate-400 font-medium pb-3 pr-4 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(empPerf?.employeeStats || []).map((emp, i) => (
                <tr key={emp._id || i} className="table-row">
                  <td className="py-3 pr-4 text-slate-500 text-xs">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                        {emp.name?.charAt(0)}
                      </div>
                      <p className="text-white font-medium">{emp.name}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{emp.totalProjects}</td>
                  <td className="py-3 pr-4 text-emerald-400 font-semibold">{emp.completed}</td>
                  <td className="py-3 pr-4 text-blue-400">{emp.active}</td>
                  <td className="py-3 pr-4 text-slate-300">{emp.avgDaysWorked}d</td>
                  <td className="py-3 pr-4 w-28"><ProgressBar progress={emp.avgProgress} size="sm" /></td>
                  <td className="py-3">
                    <span className={`badge text-xs ${emp.completionRate >= 70 ? 'bg-emerald-500/20 text-emerald-400' : emp.completionRate >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                      {Math.round(emp.completionRate)}%
                    </span>
                  </td>
                </tr>
              ))}
              {!empPerf?.employeeStats?.length && (
                <tr><td colSpan={8} className="py-8 text-center text-slate-500">No employee data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
