import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Auth
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ResetSuccessPage from './pages/auth/ResetSuccessPage';

// Super Admin
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import AdminManagement from './pages/superadmin/AdminManagement';
import DepartmentManagement from './pages/superadmin/DepartmentManagement';
import AllProjects from './pages/superadmin/AllProjects';
import SecurityLogs from './pages/superadmin/SecurityLogs';
import Analytics from './pages/superadmin/Analytics';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ProjectUpload from './pages/admin/ProjectUpload';
import ProjectManagement from './pages/admin/ProjectManagement';
import ReviewCenter from './pages/admin/ReviewCenter';
import EmployeeMonitor from './pages/admin/EmployeeMonitor';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Employee
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AvailableProjects from './pages/employee/AvailableProjects';
import MyProjects from './pages/employee/MyProjects';
import NotificationCenter from './pages/employee/NotificationCenter';
import DownloadProjectPage from './pages/employee/DownloadProjectPage';

// Profile Page
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/verify-otp" element={<PublicRoute><VerifyOTPPage /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
            <Route path="/reset-success" element={<PublicRoute><ResetSuccessPage /></PublicRoute>} />

            {/* Shared Protected Profile */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/download-project/:id" element={<ProtectedRoute><DownloadProjectPage /></ProtectedRoute>} />

            {/* Super Admin */}
            <Route path="/superadmin/dashboard" element={<ProtectedRoute roles={['superadmin', 'admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/admins" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminManagement /></ProtectedRoute>} />
            <Route path="/superadmin/departments" element={<ProtectedRoute roles={['superadmin', 'admin']}><DepartmentManagement /></ProtectedRoute>} />
            <Route path="/superadmin/projects" element={<ProtectedRoute roles={['superadmin', 'admin']}><AllProjects /></ProtectedRoute>} />
            <Route path="/superadmin/security" element={<ProtectedRoute roles={['superadmin', 'admin']}><SecurityLogs /></ProtectedRoute>} />
            <Route path="/superadmin/analytics" element={<ProtectedRoute roles={['superadmin', 'admin']}><Analytics /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/upload" element={<ProtectedRoute roles={['admin']}><ProjectUpload /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute roles={['admin']}><ProjectManagement /></ProtectedRoute>} />
            <Route path="/admin/review" element={<ProtectedRoute roles={['admin']}><ReviewCenter /></ProtectedRoute>} />
            <Route path="/admin/employees" element={<ProtectedRoute roles={['admin']}><EmployeeMonitor /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

            {/* Employee */}
            <Route path="/employee/dashboard" element={<ProtectedRoute roles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="/employee/available" element={<ProtectedRoute roles={['employee']}><AvailableProjects /></ProtectedRoute>} />
            <Route path="/employee/my-projects" element={<ProtectedRoute roles={['employee']}><MyProjects /></ProtectedRoute>} />
            <Route path="/employee/notifications" element={<ProtectedRoute roles={['employee']}><NotificationCenter /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
