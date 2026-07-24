import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Public Studio Site Components & Pages (User Facing)
import Layout from './components/public/Layout';
import Home from './pages/user/Home';
import About from './pages/user/About';
import Portfolio from './pages/user/Portfolio';
import Gallery from './pages/user/Gallery';
import Blog from './pages/user/Blog';
import Contact from './pages/user/Contact';
import Login from './pages/user/Login';
import Signup from './pages/user/Signup';
import ForgotPassword from './pages/user/ForgotPassword';
import ResetPassword from './pages/user/ResetPassword';
import UserDashboard from './pages/user/UserDashboard';

// Internal Staff Auth (Admin Portal)
import LoginPage from './pages/admin/auth/LoginPage';
import SignupPage from './pages/admin/auth/SignupPage';
import ForgotPasswordPage from './pages/admin/auth/ForgotPasswordPage';
import VerifyOTPPage from './pages/admin/auth/VerifyOTPPage';
import ResetPasswordPage from './pages/admin/auth/ResetPasswordPage';
import ResetSuccessPage from './pages/admin/auth/ResetSuccessPage';

// Super Admin Dashboards
import SuperAdminDashboard from './pages/admin/superadmin/Dashboard';
import AdminManagement from './pages/admin/superadmin/AdminManagement';
import UserManagement from './pages/admin/superadmin/UserManagement';
import DepartmentManagement from './pages/admin/superadmin/DepartmentManagement';
import AllProjects from './pages/admin/superadmin/AllProjects';
import SecurityLogs from './pages/admin/superadmin/SecurityLogs';
import Analytics from './pages/admin/superadmin/Analytics';

// Admin Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import ProjectUpload from './pages/admin/ProjectUpload';
import ProjectManagement from './pages/admin/ProjectManagement';
import ReviewCenter from './pages/admin/ReviewCenter';
import EmployeeMonitor from './pages/admin/EmployeeMonitor';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Employee Dashboards
import EmployeeDashboard from './pages/admin/employee/EmployeeDashboard';
import AvailableProjects from './pages/admin/employee/AvailableProjects';
import MyProjects from './pages/admin/employee/MyProjects';
import NotificationCenter from './pages/admin/employee/NotificationCenter';
import DownloadProjectPage from './pages/admin/employee/DownloadProjectPage';

// Profile Page (Shared Portal Profile)
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
            {/* Public Brand Site Pages */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Public Brand Auth Pages */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

            {/* Dedicated Staff Auth Portals */}
            <Route path="/employee/login" element={<PublicRoute><LoginPage portalRole="employee" /></PublicRoute>} />
            <Route path="/admin/login" element={<PublicRoute><LoginPage portalRole="admin" /></PublicRoute>} />
            <Route path="/superadmin/login" element={<PublicRoute><LoginPage portalRole="superadmin" /></PublicRoute>} />
            <Route path="/staff/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/admin/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/admin/verify-otp" element={<PublicRoute><VerifyOTPPage /></PublicRoute>} />
            <Route path="/admin/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
            <Route path="/admin/reset-success" element={<PublicRoute><ResetSuccessPage /></PublicRoute>} />

            {/* Shared Protected Profile */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/download-project/:id" element={<ProtectedRoute><DownloadProjectPage /></ProtectedRoute>} />
            
            {/* Client (User) Protected Dashboard */}
            <Route path="/client/dashboard" element={<ProtectedRoute roles={['client']}><UserDashboard /></ProtectedRoute>} />

            {/* Super Admin */}
            <Route path="/superadmin/dashboard" element={<ProtectedRoute roles={['superadmin', 'admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/admins" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminManagement /></ProtectedRoute>} />
            <Route path="/superadmin/users" element={<ProtectedRoute roles={['superadmin', 'admin']}><UserManagement /></ProtectedRoute>} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
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
