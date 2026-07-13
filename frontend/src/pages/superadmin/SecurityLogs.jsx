import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api';
import Layout from '../../components/Layout';
import { Activity, Shield, User, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const actionColors = {
  login: 'text-emerald-400', logout: 'text-slate-400',
  login_failed: 'text-red-400', login_locked: 'text-red-500',
  project_upload: 'text-blue-400', project_update: 'text-blue-300',
  project_assign: 'text-purple-400', project_pickup: 'text-purple-300',
  progress_update: 'text-cyan-400',
  review_approve: 'text-emerald-400', review_reject: 'text-red-400',
  user_create: 'text-emerald-400', user_deactivate: 'text-red-400',
  department_create: 'text-amber-400',
  '2fa_setup': 'text-purple-400', '2fa_verify': 'text-purple-300',
};

const actionIcons = {
  login: '🔓', logout: '🔒', login_failed: '❌', login_locked: '🚫',
  project_upload: '📤', project_update: '✏️', project_pickup: '🤚',
  progress_update: '📊', review_approve: '✅', review_reject: '🔄',
  user_create: '👤', department_create: '🏢',
  '2fa_setup': '🔐', '2fa_verify': '🔑',
};

export default function SecurityLogs() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, filter],
    queryFn: () => analyticsAPI.getActivityLogs({ page, limit: 30, ...(filter ? { action: filter } : {}) }).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: waLog } = useQuery({
    queryKey: ['whatsapp-log'],
    queryFn: () => analyticsAPI.getWhatsAppLog().then(r => r.data),
  });

  const logs = data?.logs || [];
  const filtered = search ? logs.filter(l =>
    (l.userEmail || '').includes(search) || (l.action || '').includes(search) || (l.target || '').includes(search)
  ) : logs;

  const actions = [
    'login', 'login_failed', 'project_upload', 'project_pickup',
    'progress_update', 'review_approve', 'review_reject', 'user_create',
  ];

  return (
    <Layout title="Security & Audit Logs" subtitle="Monitor all system activity and security events">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Events', value: data?.total || 0, icon: Activity, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Login Events', value: logs.filter(l => l.action === 'login').length, icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Failed Logins', value: logs.filter(l => l.action === 'login_failed').length, icon: XCircle, color: 'text-red-400 bg-red-500/10' },
          { label: 'WA Messages', value: waLog?.log?.length || 0, icon: Shield, color: 'text-purple-400 bg-purple-500/10' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className={`w-10 h-10 rounded-xl ${s.color.split(' ')[1]} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color.split(' ')[0]}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-slate-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Log */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Activity Log</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input className="input pl-8 py-1.5 text-sm w-48" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="input py-1.5 text-sm w-40" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">All actions</option>
                {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map(log => (
                <div key={log._id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/3 ${!log.success ? 'bg-red-500/5' : ''}`}>
                  <span className="text-lg flex-shrink-0 mt-0.5">{actionIcons[log.action] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${actionColors[log.action] || 'text-slate-300'}`}>
                        {log.action?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-slate-500 text-xs flex-shrink-0">
                        {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs truncate">{log.target || log.userEmail}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-slate-500 text-xs">{log.userEmail}</span>
                      {log.ip && <span className="text-slate-600 text-xs">{log.ip}</span>}
                    </div>
                  </div>
                  {!log.success && (
                    <span className="badge bg-red-500/20 text-red-400 flex-shrink-0">Failed</span>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">No logs found</p>
              )}
            </div>
          )}

          {data?.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-50">Previous</button>
              <span className="text-slate-400 text-sm">Page {page} of {data.totalPages}</span>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>

        {/* WhatsApp Logs */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-1">WhatsApp Messages</h3>
          <p className="text-slate-400 text-xs mb-4">System & Simulation logs</p>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {(waLog?.log || []).length === 0 && (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📱</p>
                <p className="text-slate-500 text-sm">No messages sent yet</p>
                <p className="text-slate-600 text-xs mt-1">Messages appear here when projects are processed</p>
              </div>
            )}
            {(waLog?.log || []).map((msg) => (
              <div key={msg._id || msg.timestamp} className={`border rounded-xl p-3 transition-all ${
                msg.status === 'failed' ? 'bg-red-500/5 border-red-500/20' :
                msg.status === 'sent' ? 'bg-blue-500/5 border-blue-500/20' :
                'bg-emerald-500/5 border-emerald-500/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    msg.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    msg.status === 'sent' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    📱 {msg.status === 'simulated' ? 'Simulated' : msg.status === 'sent' ? 'Sent (Twilio)' : 'Failed'}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {msg.timestamp ? format(new Date(msg.timestamp), 'dd MMM, HH:mm') : ''}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-2">
                  {msg.message}
                </p>
                <div className="mt-2 flex flex-col gap-1 text-[10px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Group: <strong className="text-slate-400">{msg.group?.name || 'Unknown Group'}</strong></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient: <span className="text-slate-600 font-mono">{msg.recipient || msg.group?.groupId}</span></span>
                  </div>
                  {msg.sender ? (
                    <div>
                      Sender: <span className="text-slate-400">{msg.sender.name} ({msg.sender.role.toUpperCase()})</span>
                    </div>
                  ) : (
                    <div>
                      Sender: <span className="text-slate-400">System (Automated Cron)</span>
                    </div>
                  )}
                  {msg.sid && (
                    <div className="truncate text-slate-600 font-mono">
                      SID: {msg.sid}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
