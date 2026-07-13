import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI } from '../../../api';
import Layout from '../../../components/Layout';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const typeIcons = {
  project_upload: '📤', project_assigned: '👤',
  progress_update: '📊', review_request: '📋',
  review_approved: '✅', review_rejected: '🔄',
  deadline_alert: '⚠️', system: '🔔', whatsapp_sent: '📱',
};

export default function NotificationCenter() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => analyticsAPI.getNotifications({ limit: 50 }).then(r => r.data),
    refetchInterval: 15000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => analyticsAPI.markAllNotificationsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      qc.invalidateQueries(['notifications']);
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id) => analyticsAPI.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const notifications = data?.notifications || [];
  const unread = notifications.filter(n => !n.read).length;

  return (
    <Layout title="Notifications" subtitle="All system notifications">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300 text-sm">{notifications.length} notifications</span>
            {unread > 0 && <span className="badge bg-blue-500/20 text-blue-400">{unread} unread</span>}
          </div>
          {unread > 0 && (
            <button onClick={() => markAllMutation.mutate()} className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 px-3">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">All caught up!</p>
            <p className="text-slate-400 text-sm">No notifications to show</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => !notif.read && markOneMutation.mutate(notif._id)}
                className={`glass-card p-4 cursor-pointer hover:bg-white/8 transition-colors ${!notif.read ? 'border-l-2 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{typeIcons[notif.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white font-semibold text-sm">{notif.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-500 text-xs">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                        {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                    {notif.sender?.name && (
                      <p className="text-slate-600 text-xs mt-1">From: {notif.sender.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
