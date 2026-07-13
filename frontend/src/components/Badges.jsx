import React from 'react';

const statusMap = {
  available: { label: 'Available', cls: 'badge-available' },
  'in-progress': { label: 'In Progress', cls: 'badge-in-progress' },
  review: { label: 'Review', cls: 'badge-review' },
  completed: { label: 'Completed', cls: 'badge-completed' },
  delayed: { label: 'Delayed', cls: 'badge-delayed' },
  pending: { label: 'Pending', cls: 'badge-pending' },
  active: { label: 'Active', cls: 'badge-in-progress' },
  dropped: { label: 'Dropped', cls: 'badge-delayed' },
};

const priorityMap = {
  low: { label: 'Low', cls: 'priority-low' },
  medium: { label: 'Medium', cls: 'priority-medium' },
  high: { label: 'High', cls: 'priority-high' },
  critical: { label: '🔥 Critical', cls: 'priority-critical' },
};

export function StatusBadge({ status }) {
  const s = statusMap[status] || { label: status, cls: 'badge-pending' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function PriorityBadge({ priority }) {
  const p = priorityMap[priority] || { label: priority, cls: 'priority-medium' };
  return <span className={`badge ${p.cls}`}>{p.label}</span>;
}

export function RoleBadge({ role }) {
  const roleMap = {
    superadmin: { label: 'Developer', cls: 'bg-purple-500/20 text-purple-400' },
    admin: { label: 'Admin', cls: 'bg-blue-500/20 text-blue-400' },
    employee: { label: 'Employee', cls: 'bg-emerald-500/20 text-emerald-400' },
  };
  const r = roleMap[role] || { label: role, cls: 'bg-slate-500/20 text-slate-400' };
  return <span className={`badge ${r.cls}`}>{r.label}</span>;
}

export function ProgressBar({ progress, showLabel = true, size = 'md' }) {
  const heightMap = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  const color = progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : progress >= 25 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 progress-bar ${heightMap[size]}`}>
        <div
          className={`progress-fill ${color}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showLabel && <span className="text-slate-400 text-xs w-8 text-right">{progress}%</span>}
    </div>
  );
}
