import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, RefreshCw, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function TopBar({ title, subtitle, onToggleMobileSidebar }) {
  const { user, socket } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const { data } = await analyticsAPI.getNotifications({ limit: 10 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
    if (socket) {
      socket.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev.slice(0, 9)]);
        setUnreadCount(c => c + 1);
        toast(notif.message, { icon: '🔔', duration: 4000 });
      });
      return () => socket.off('notification');
    }
  }, [socket]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id) => {
    try {
      await analyticsAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await analyticsAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const notifTypeColors = {
    project_upload: 'bg-blue-500',
    project_assigned: 'bg-purple-500',
    progress_update: 'bg-emerald-500',
    review_request: 'bg-amber-500',
    review_approved: 'bg-emerald-500',
    review_rejected: 'bg-red-500',
    deadline_alert: 'bg-red-500',
    system: 'bg-slate-500',
  };

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-20">
      {/* Left section: Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-bold text-base md:text-lg leading-tight truncate max-w-[180px] sm:max-w-xs md:max-w-md">{title}</h1>
          {subtitle && <p className="text-slate-400 text-[10px] md:text-xs truncate max-w-[180px] sm:max-w-xs md:max-w-md">{subtitle}</p>}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Refresh */}
        <button
          onClick={loadNotifications}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(s => !s)}
            className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <h3 className="text-white font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.read && markRead(notif._id)}
                      className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/3 transition-colors ${!notif.read ? 'bg-blue-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notifTypeColors[notif.type] || 'bg-slate-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium leading-tight">{notif.title}</p>
                          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform"
        >
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
}
