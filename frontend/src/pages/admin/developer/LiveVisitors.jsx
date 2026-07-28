import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Users, MapPin, Clock, Globe, Search, Filter, 
  Download, Eye, ArrowRight, X, Sparkles, RefreshCw,
  Monitor, Smartphone, Tablet, ExternalLink, Calendar,
  Link, Shield, Play, CheckCircle, AlertTriangle, Code
} from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import StatsCard from '../../../components/StatsCard';

// Get API base URL depending on env (with dynamic local hostname fallback for mobile/tablet testing in local network)
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return `${window.location.protocol}//${window.location.hostname}:5000`;
};
const API_URL = getApiUrl();

export default function LiveVisitors() {
  const { user, socket } = useAuth();
  const [stats, setStats] = useState({
    online: 0,
    today: 0,
    yesterday: 0,
    week: 0,
    month: 0,
    total: 0,
    unique: 0,
    new: 0,
    returning: 0,
    avgDuration: 0,
    activeCountry: 'India',
    activeCity: 'Nashik',
    activePage: '/'
  });
  
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Active selected visitor for sidebar flow details
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'webhook'

  // Webhook settings state variables
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookConfigLoading, setWebhookConfigLoading] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  const fetchWebhookConfig = async () => {
    try {
      setWebhookConfigLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/api/visitor-analytics/admin/webhook`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.webhook) {
        setWebhookUrl(res.data.webhook.url);
        setWebhookEnabled(res.data.webhook.isEnabled);
        setWebhookSecret(res.data.webhook.secret || '');
      }
    } catch (err) {
      console.error('Failed to load webhook configuration:', err);
    } finally {
      setWebhookConfigLoading(false);
    }
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    try {
      setWebhookSaving(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_URL}/api/visitor-analytics/admin/webhook`, {
        url: webhookUrl,
        isEnabled: webhookEnabled,
        secret: webhookSecret
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert('Webhook configuration saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save webhook config:', err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      alert('Please enter a Webhook URL first.');
      return;
    }
    try {
      setWebhookTesting(true);
      setWebhookTestResult(null);
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${API_URL}/api/visitor-analytics/admin/webhook/test`, {
        url: webhookUrl,
        secret: webhookSecret
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWebhookTestResult({
        success: res.data.success,
        statusCode: res.data.statusCode,
        response: res.data.response
      });
    } catch (err) {
      console.error('Failed to test webhook:', err);
      setWebhookTestResult({
        success: false,
        statusCode: err.response?.status || 'Network Error',
        response: err.response?.data?.message || err.message
      });
    } finally {
      setWebhookTesting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'webhook') {
      fetchWebhookConfig();
    }
  }, [activeTab]);

  // Load visitor statistics & live visitors list
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/api/visitor-analytics/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load live visitor stats:', err);
    }
  };

  const fetchVisitorsList = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = {
        page: pageNumber,
        search,
        status: statusFilter,
        device: deviceFilter,
        source: sourceFilter
      };
      
      const res = await axios.get(`${API_URL}/api/visitor-analytics/admin/live`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setVisitors(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setPage(res.data.pagination.page);
      }
    } catch (err) {
      console.error('Failed to load visitors list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search / filters
  useEffect(() => {
    fetchVisitorsList(1);
  }, [search, statusFilter, deviceFilter, sourceFilter]);

  // Initial load and socket listener connection
  useEffect(() => {
    fetchStats();
    fetchVisitorsList(1);

    if (socket) {
      // Handle real-time visitor landing alerts
      socket.on('new_visitor', (data) => {
        // Prepend to state list if not already present
        setVisitors(prev => {
          if (prev.some(v => v.sessionId === data.sessionId)) return prev;
          
          const newVisitor = {
            sessionId: data.sessionId,
            visitorId: data.visitorId,
            ipAddress: 'Checking...',
            country: data.country,
            state: '',
            city: data.city,
            timezone: 'Asia/Kolkata',
            latitude: null,
            longitude: null,
            isp: 'ISP Lookup',
            browser: data.browser,
            browserVersion: '',
            os: '',
            deviceType: data.deviceType,
            screenResolution: '',
            language: '',
            userAgent: '',
            referralSource: 'Direct',
            landingPage: data.visitedPage,
            visitStart: new Date(data.timestamp),
            visitEnd: new Date(data.timestamp),
            duration: 0,
            exitPage: data.visitedPage,
            status: 'online',
            isNewVisitor: true,
            timeline: [{
              page: data.visitedPage,
              type: 'page_view',
              timestamp: new Date(data.timestamp),
              meta: { title: 'Landing Page' }
            }]
          };
          return [newVisitor, ...prev];
        });

        // Increment stats count live
        setStats(prev => ({
          ...prev,
          online: prev.online + 1,
          today: prev.today + 1,
          total: prev.total + 1
        }));
      });

      // Handle real-time visitor navigations
      socket.on('visitor_event', (eventData) => {
        setVisitors(prev => {
          return prev.map(v => {
            if (v.sessionId === eventData.sessionId) {
              const isPageView = eventData.type === 'page_view';
              const updatedTimeline = [...(v.timeline || []), {
                page: eventData.page,
                type: eventData.type,
                timestamp: new Date(eventData.timestamp),
                meta: eventData.meta
              }];
              return {
                ...v,
                visitEnd: new Date(eventData.timestamp),
                duration: Math.max(0, Math.floor((new Date(eventData.timestamp).getTime() - new Date(v.visitStart).getTime()) / 1000)),
                exitPage: isPageView ? eventData.page : v.exitPage,
                timeline: updatedTimeline
              };
            }
            return v;
          });
        });
      });

      // Handle online counts updates
      socket.on('active_visitors_update', (data) => {
        setStats(prev => ({ ...prev, online: data.activeCount }));
      });
    }

    // Refresh statistics periodically (every 30 seconds)
    const statsTimer = setInterval(fetchStats, 30000);

    // Keep durations ticking live for online visitors in state
    const durationTicker = setInterval(() => {
      setVisitors(prev => {
        return prev.map(v => {
          if (v.status === 'online') {
            const nextDuration = v.duration + 1;
            return {
              ...v,
              duration: nextDuration
            };
          }
          return v;
        });
      });
    }, 1000);

    return () => {
      if (socket) {
        socket.off('new_visitor');
        socket.off('visitor_event');
        socket.off('active_visitors_update');
      }
      clearInterval(statsTimer);
      clearInterval(durationTicker);
    };
  }, [socket]);

  const handleExport = (format) => {
    const token = localStorage.getItem('accessToken');
    window.open(`${API_URL}/api/visitor-analytics/admin/export?format=${format}&token=${token}`, '_blank');
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'Mobile': return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'Tablet': return <Tablet className="w-4 h-4 text-cyan-400" />;
      default: return <Monitor className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="p-6 md:p-10 bg-dark-950 min-h-screen text-slate-100 flex flex-col gap-8 relative overflow-hidden">
      
      {/* Glow backgrounds */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest mb-1.5">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Real-Time Monitor</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Live Visitors</h1>
          <p className="text-slate-400 text-xs mt-1">Monitor active customer sessions and visualizer analytics feeds.</p>
        </div>

        {/* Exporter actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => { fetchStats(); fetchVisitorsList(1); }}
            className="p-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-200 rounded-xl hover:border-slate-700 transition-all cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-6 z-10">
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'live' 
              ? 'text-amber-500 border-amber-500 font-extrabold' 
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Live Monitor
        </button>
        <button
          onClick={() => setActiveTab('webhook')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'webhook' 
              ? 'text-amber-500 border-amber-500 font-extrabold' 
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Webhook Settings
        </button>
      </div>

      {activeTab === 'live' ? (
        <>
          {/* Analytics statistics counters (Glassmorphic cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
        <div className="glass-card p-6 flex items-center justify-between border border-white/5 shadow-xl">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visitors Online</span>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-3xl font-extrabold text-white leading-none">{stats.online}</p>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Active in last 30s</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between border border-white/5 shadow-xl">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Visitors</span>
            <p className="text-3xl font-extrabold text-white leading-none">{stats.today}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Yesterday: {stats.yesterday}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between border border-white/5 shadow-xl">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unique Hits</span>
            <p className="text-3xl font-extrabold text-white leading-none">{stats.unique}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">New: {stats.new} | Ret: {stats.returning}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between border border-white/5 shadow-xl">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Session Time</span>
            <p className="text-3xl font-extrabold text-white leading-none">
              {stats.avgDuration > 60 ? `${Math.round(stats.avgDuration / 60)}m` : `${stats.avgDuration}s`}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Most Active: {stats.activeCity}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="glass-card p-5 border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-5 z-10">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by IP, Country, City, Browser..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
            </select>
          </div>

          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="">All Devices</option>
            <option value="Desktop">Desktop</option>
            <option value="Mobile">Mobile</option>
            <option value="Tablet">Tablet</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="">All Sources</option>
            <option value="Direct">Direct</option>
            <option value="Google">Google</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="Twitter">Twitter</option>
          </select>
        </div>
      </div>

      {/* Main Table section */}
      <div className="glass-card border border-white/5 overflow-hidden shadow-2xl z-10 flex-1 flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Visitor Profile</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">IP Address</th>
                <th className="py-4 px-6">Device / Browser</th>
                <th className="py-4 px-6">Traffic Source</th>
                <th className="py-4 px-6">Current page</th>
                <th className="py-4 px-6 text-right">Session Details</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-500 text-xs">
                    <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
                    <span>Loading Live Visitor telemetry...</span>
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-500 text-xs">
                    No active visitor sessions match the current search filters.
                  </td>
                </tr>
              ) : (
                visitors.map((visitor) => {
                  const isOnline = visitor.status === 'online' && (new Date(visitor.visitEnd).getTime() > Date.now() - 30 * 1000);
                  const durationMins = Math.floor(visitor.duration / 60);
                  const durationSecs = visitor.duration % 60;
                  
                  return (
                    <tr key={visitor.sessionId} className="border-b border-slate-850/60 hover:bg-white/[0.01] transition-colors text-xs text-slate-300">
                      
                      {/* Profile Icon & Status Indicator */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                              {visitor.city?.charAt(0) || 'G'}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-dark-900 flex items-center justify-center ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                          </div>
                          <div>
                            <p className="text-white font-bold tracking-wide">Guest Visitor</p>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block">
                              {visitor.isNewVisitor ? 'New User' : 'Returning'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location details */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <div>
                            <p className="text-slate-200 font-semibold">{visitor.city || 'Nashik'}</p>
                            <span className="text-[10px] text-slate-500">{visitor.country || 'India'}</span>
                          </div>
                        </div>
                      </td>

                      {/* IP address */}
                      <td className="py-4.5 px-6 font-mono text-slate-400">
                        {visitor.ipAddress}
                      </td>

                      {/* Device & Browser Badge */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-2.5">
                          {getDeviceIcon(visitor.deviceType)}
                          <div>
                            <p className="text-slate-200 font-semibold">{visitor.browser || 'Chrome'}</p>
                            <span className="text-[9px] text-slate-500">{visitor.os || 'Windows'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Traffic referral source */}
                      <td className="py-4.5 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          visitor.referralSource === 'Direct' ? 'bg-slate-900 text-slate-400 border-slate-800' :
                          visitor.referralSource === 'Google' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          visitor.referralSource === 'LinkedIn' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {visitor.referralSource}
                        </span>
                      </td>

                      {/* Current Active Page */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 max-w-[150px] truncate block" title={visitor.exitPage || visitor.landingPage}>
                            {visitor.exitPage || visitor.landingPage}
                          </span>
                          <a href={visitor.exitPage || visitor.landingPage} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      {/* Session duration & starts */}
                      <td className="py-4.5 px-6 text-right">
                        <p className="text-white font-bold">
                          {durationMins > 0 ? `${durationMins}m ` : ''}{durationSecs}s
                        </p>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {new Date(visitor.visitStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedVisitor(visitor)}
                          className="inline-flex items-center gap-1.5 border border-slate-850 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Timeline</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-850/60 bg-slate-900/10">
            <p className="text-xs text-slate-500">
              Showing page <span className="text-slate-300 font-bold">{page}</span> of <span className="text-slate-300 font-bold">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => fetchVisitorsList(page - 1)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-350 border border-slate-850 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => fetchVisitorsList(page + 1)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-slate-350 border border-slate-850 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
          {/* Configuration Card */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-card p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500" />
                  <span>Webhook Configuration</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">Configure an HTTP POST target URL to receive real-time visitor alerts instantly.</p>
              </div>

              {webhookConfigLoading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleSaveWebhook} className="flex flex-col gap-5">
                  {/* Enabled switch */}
                  <div className="flex items-center justify-between bg-slate-900/40 border border-slate-850 p-4.5 rounded-xl">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">Enable Webhook</span>
                      <span className="text-[10px] text-slate-500">Deliver POST payloads when visits start.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={webhookEnabled}
                        onChange={(e) => setWebhookEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white" />
                    </label>
                  </div>

                  {/* Webhook target URL */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Link className="w-4 h-4 text-slate-400" />
                      <span>Target Payload Destination URL</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://api.yourservice.com/v1/webhooks/visitors"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="bg-slate-900/60 border border-slate-850 focus:border-amber-500/50 outline-none text-slate-100 rounded-xl px-4 py-3 text-xs font-medium w-full transition-all"
                    />
                  </div>

                  {/* Signature secret key */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span>Signature Signing Secret Key (Optional)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. whsec_your_secret_signing_key"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="bg-slate-900/60 border border-slate-850 focus:border-amber-500/50 outline-none text-slate-100 rounded-xl px-4 py-3 text-xs font-medium w-full transition-all"
                    />
                    <span className="text-[10px] text-slate-500 leading-normal">
                      Sent in the `X-Visitor-Webhook-Secret` header to let your application authenticate the payload sender.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="submit"
                      disabled={webhookSaving}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      {webhookSaving ? 'Saving Config...' : 'Save Configuration'}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={webhookTesting || !webhookUrl}
                      className="flex items-center justify-center gap-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 disabled:opacity-50 text-slate-200 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{webhookTesting ? 'Testing...' : 'Test URL'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Test result status panel */}
            {webhookTestResult && (
              <div className="glass-card p-6 border border-white/5 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Test Event Response Details</span>
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    webhookTestResult.success 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {webhookTestResult.success ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Success</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Failed</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">HTTP Status Code</p>
                    <p className="text-white font-mono mt-1 font-bold">{webhookTestResult.statusCode}</p>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Response Format</p>
                    <p className="text-white font-mono mt-1">Plaintext / JSON</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Response Payload</p>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto break-all whitespace-pre-wrap max-h-[250px]">
                    {webhookTestResult.response || '[Empty Response Body]'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Guide Card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card p-6 md:p-8 border border-white/5 shadow-2xl flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Code className="w-4 h-4 text-amber-500" />
                  <span>Payload Schema</span>
                </h3>
                <p className="text-slate-400 text-[10px] mt-1 leading-normal">
                  Your server receives this JSON structure via HTTP `POST` when a visitor lands on any page.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">JSON Schema Blueprint</span>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-[9px] font-mono text-slate-300 overflow-x-auto leading-relaxed select-all">
{`{
  "event": "visitor.visited",
  "timestamp": "2026-07-27T14:15:36Z",
  "data": {
    "sessionId": "sess_1a2b3c4d",
    "visitorId": "vis_9x8y7z6w",
    "ipAddress": "103.51.15.110",
    "country": "India",
    "state": "Maharashtra",
    "city": "Nashik",
    "timezone": "Asia/Kolkata",
    "browser": "Chrome",
    "os": "Windows",
    "deviceType": "Desktop",
    "referralSource": "Direct",
    "landingPage": "/",
    "visitStart": "2026-07-27T14:15:36Z"
  }
}`}
                </pre>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Security Recommendations</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Verify the signature using the `X-Visitor-Webhook-Secret` token header parameter on your server endpoint to ensure authenticity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visitor Timeline Side Drawer Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 bg-[#020617]/70 backdrop-blur-sm flex justify-end">
          <div 
            className="w-full max-w-lg bg-dark-900 border-l border-white/5 h-full p-8 flex flex-col gap-6 shadow-2xl overflow-y-auto animate-slide-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close action */}
            <button 
              onClick={() => setSelectedVisitor(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Session Timeline</span>
              </div>
              <h2 className="text-2xl font-black text-white">Navigation Journey</h2>
              <p className="text-slate-400 text-xs mt-1">Detailed flow map for visitor session: <span className="font-mono text-amber-400">{selectedVisitor.sessionId.substring(0, 8)}...</span></p>
            </div>

            {/* Profile specifications */}
            <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl grid grid-cols-2 gap-4 text-xs text-slate-350">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">IP Address</p>
                <p className="text-slate-200 font-mono mt-0.5">{selectedVisitor.ipAddress}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Location</p>
                <p className="text-slate-200 font-semibold mt-0.5">{selectedVisitor.city}, {selectedVisitor.country}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Browser & OS</p>
                <p className="text-slate-200 font-semibold mt-0.5">{selectedVisitor.browser} / {selectedVisitor.os}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Resolution / Lang</p>
                <p className="text-slate-200 font-semibold mt-0.5">{selectedVisitor.screenResolution} ({selectedVisitor.language})</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase">ISP</p>
                <p className="text-slate-200 mt-0.5">{selectedVisitor.isp}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase">User Agent</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 break-all leading-normal bg-slate-900 p-2.5 rounded border border-slate-850">{selectedVisitor.userAgent}</p>
              </div>
            </div>

            {/* Navigation journey timeline steps */}
            <div className="flex-1 flex flex-col gap-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>User Navigation Path</span>
              </h3>

              <div className="relative border-l border-slate-850 pl-6 flex flex-col gap-8 flex-1">
                {selectedVisitor.timeline && selectedVisitor.timeline.length > 0 ? (
                  selectedVisitor.timeline.map((event, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center ${
                        event.type === 'page_view' ? 'border-amber-500' :
                        event.type === 'click' ? 'border-blue-500' : 'border-purple-500'
                      }`} />

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            event.type === 'page_view' ? 'text-amber-400' :
                            event.type === 'click' ? 'text-blue-400' : 'text-purple-400'
                          }`}>
                            {event.type === 'page_view' ? 'Visited Page' :
                             event.type === 'click' ? 'Clicked Button/Link' : 'Scroll Trigger'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-white font-mono bg-slate-950/50 border border-slate-850 px-3 py-1.5 rounded-lg text-[11px] w-fit">
                          {event.page}
                        </p>

                        {event.meta && (
                          <div className="text-[11px] text-slate-400 pl-2 leading-relaxed">
                            {event.meta.title && <p>Title: {event.meta.title}</p>}
                            {event.meta.text && <p>Label: "{event.meta.text}"</p>}
                            {event.meta.element && <p>Tag: &lt;{event.meta.element}&gt;</p>}
                            {event.meta.scrollDepthPercent && <p>Max Scroll Depth: {event.meta.scrollDepthPercent}%</p>}
                            {event.meta.totalClicks && <p>Clicks Count: {event.meta.totalClicks}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No events captured for this session.</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-850 pt-5 text-center">
              <button 
                onClick={() => setSelectedVisitor(null)}
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-850 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Close Timeline Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
