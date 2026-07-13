import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api';
import Layout from '../../components/Layout';
import { ProgressBar } from '../../components/Badges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-900 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }} className="text-sm font-medium">{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function AdminAnalytics() {
  const { data: empPerf } = useQuery({
    queryKey: ['employee-performance'],
    queryFn: () => analyticsAPI.getEmployeePerformance().then(r => r.data),
  });

  const { data: deptPerf } = useQuery({
    queryKey: ['department-performance'],
    queryFn: () => analyticsAPI.getDepartmentPerformance().then(r => r.data),
  });

  const empChart = (empPerf?.employeeStats || []).slice(0, 6).map(e => ({
    name: e.name?.split(' ')[0],
    Completed: e.completed,
    Active: e.active,
    'Avg %': e.avgProgress,
  }));

  return (
    <Layout title="Analytics" subtitle="Employee and department performance insights">
      <div className="glass-card p-6 mb-6">
        <h3 className="text-white font-semibold mb-1">Employee Performance</h3>
        <p className="text-slate-400 text-xs mb-4">Projects completed vs active</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={empChart} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
            <Bar dataKey="Completed" fill="#10B981" radius={[4,4,0,0]} />
            <Bar dataKey="Active" fill="#3B82F6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(deptPerf?.deptPerf || []).map(dept => (
          <div key={dept._id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{dept.icon || '🏢'}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{dept.name}</p>
                  <p className="text-slate-500 text-xs">{dept.total} total projects</p>
                </div>
              </div>
              <span className={`text-lg font-bold ${dept.completionRate >= 70 ? 'text-emerald-400' : dept.completionRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {dept.completionRate}%
              </span>
            </div>
            <ProgressBar progress={dept.completionRate} size="sm" showLabel={false} />
            <div className="flex items-center gap-4 mt-2">
              <span className="text-emerald-400 text-xs">✅ {dept.completed}</span>
              <span className="text-blue-400 text-xs">⏳ {dept.active}</span>
              <span className="text-red-400 text-xs">⚠️ {dept.delayed}</span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
