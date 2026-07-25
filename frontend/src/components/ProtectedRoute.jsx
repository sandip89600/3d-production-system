import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

const roleRedirects = {
  developer: '/developer/dashboard',
  admin: '/admin/dashboard',
  employee: '/employee/dashboard',
  client: '/client/dashboard',
};

const getRedirectPath = (path) => {
  if (path.startsWith('/client') || path.startsWith('/dashboard')) return '/login';
  if (path.startsWith('/developer')) return '/developer/login';
  if (path.startsWith('/employee')) return '/employee/login';
  return '/admin/login';
};

export const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        authAPI.logUnauthorized(location.pathname).catch(() => {});
      } else if (roles && !roles.includes(user.role)) {
        authAPI.logUnauthorized(`${location.pathname} (Forbidden for role ${user.role})`).catch(() => {});
      }
    }
  }, [loading, user, location.pathname, roles]);

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
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (user) {
    return <Navigate to={roleRedirects[user.role] || '/client/dashboard'} replace />;
  }
  return children;
};
