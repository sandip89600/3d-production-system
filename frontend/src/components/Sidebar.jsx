import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, Users, Building2, BarChart3,
  Shield, LogOut, ChevronLeft, ChevronRight, Boxes, Upload,
  ClipboardList, Eye, Bell, CheckSquare, User, Settings,
  Activity, MessageSquare, ListTodo,
} from 'lucide-react';

const superAdminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/superadmin/dashboard' },
  { label: 'All Projects', icon: FolderKanban, path: '/superadmin/projects' },
  { label: 'Admin Management', icon: Users, path: '/superadmin/admins' },
  { label: 'Client Management', icon: Users, path: '/superadmin/users' },
  { label: 'Departments', icon: Building2, path: '/superadmin/departments' },
  { label: 'Analytics', icon: BarChart3, path: '/superadmin/analytics' },
  { label: 'Security & Logs', icon: Shield, path: '/superadmin/security' },
];

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/superadmin/dashboard' },
  { label: 'Upload Project', icon: Upload, path: '/admin/upload' },
  { label: 'My Projects', icon: FolderKanban, path: '/admin/projects' },
  { label: 'All Projects', icon: FolderKanban, path: '/superadmin/projects' },
  { label: 'Review Center', icon: ClipboardList, path: '/admin/review' },
  { label: 'Monitor Employees', icon: Eye, path: '/admin/employees' },
  { label: 'Admin Management', icon: Users, path: '/superadmin/admins' },
  { label: 'Client Management', icon: Users, path: '/superadmin/users' },
  { label: 'Departments', icon: Building2, path: '/superadmin/departments' },
  { label: 'Analytics', icon: BarChart3, path: '/superadmin/analytics' },
  { label: 'Security & Logs', icon: Shield, path: '/superadmin/security' },
];

const employeeNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/employee/dashboard' },
  { label: 'Available Projects', icon: Boxes, path: '/employee/available' },
  { label: 'My Projects', icon: ListTodo, path: '/employee/my-projects' },
  { label: 'Notifications', icon: Bell, path: '/employee/notifications' },
];

const navMap = {
  superadmin: superAdminNav,
  admin: adminNav,
  employee: employeeNav,
};

const roleColors = {
  superadmin: 'from-purple-600 to-blue-600',
  admin: 'from-blue-600 to-cyan-600',
  employee: 'from-emerald-600 to-teal-600',
};

const roleLabels = {
  superadmin: 'Developer',
  admin: 'Admin',
  employee: 'Employee',
};

export default function Sidebar({ mobileSidebarOpen, setMobileSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = navMap[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    if (setMobileSidebarOpen) setMobileSidebarOpen(false);
    navigate('/admin/login');
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col h-screen bg-dark-900 border-r border-white/5 transition-all duration-300 flex-shrink-0 
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:relative ${collapsed ? 'md:w-20' : 'md:w-64'} w-64`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColors[user?.role] || 'from-blue-600 to-purple-600'} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <Boxes className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || mobileSidebarOpen) && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">All3DStudio</p>
            <p className="text-slate-400 text-xs">Management System</p>
          </div>
        )}
      </div>

      {/* User info */}
      {(!collapsed || mobileSidebarOpen) && (
        <div className="px-4 py-4 border-b border-white/5">
          <div
            onClick={() => {
              navigate('/profile');
              if (setMobileSidebarOpen) setMobileSidebarOpen(false);
            }}
            className="flex items-center gap-3 glass-card p-3 cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleColors[user?.role] || 'from-blue-600 to-purple-600'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">
                {user?.adminCode ? `[${user.adminCode}] ` : ''}{roleLabels[user?.role]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileSidebarOpen && setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'md:justify-center md:px-3' : ''}`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className={`text-sm font-medium ${collapsed ? 'md:hidden' : 'block'}`}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'md:justify-center md:px-3' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={`text-sm font-medium ${collapsed ? 'md:hidden' : 'block'}`}>Logout</span>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-dark-800 border border-white/10 rounded-full items-center justify-center text-slate-400 hover:text-white hover:bg-dark-700 transition-all z-10 hidden md:flex"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
