import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleRedirects = {
  superadmin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  employee: '/employee/dashboard',
  client: '/client/dashboard',
};

const getRedirectPath = (path) => {
  if (path.startsWith('/client') || path.startsWith('/dashboard')) return '/login';
  if (path.startsWith('/superadmin')) return '/superadmin/login';
  if (path.startsWith('/employee')) return '/employee/login';
  return '/admin/login';
};

export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={getRedirectPath(location.pathname)} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleRedirects[user.role] || getRedirectPath(location.pathname)} replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={roleRedirects[user.role] || '/client/dashboard'} replace />;
  }
  return children;
};
