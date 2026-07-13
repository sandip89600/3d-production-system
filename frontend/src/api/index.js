import api from './client';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA: (token) => api.post('/auth/2fa/disable', { token }),
  changePassword: (data) => api.post('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPasswordEmail: (email) => api.post('/auth/forgot-password/email', { email }),
  forgotPasswordMobile: (mobile) => api.post('/auth/forgot-password/mobile', { mobile }),
  verifyOTP: (emailOrMobile, otp) => api.post('/auth/verify-otp', { emailOrMobile, otp }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile/update', data),
  changePassword: (data) => api.put('/profile/change-password', data),
  uploadPhoto: (formData) => api.post('/profile/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removePhoto: () => api.delete('/profile/remove-photo'),
  getActivity: (page) => api.get('/profile/activity', { params: { page } }),
  logoutAllDevices: () => api.post('/profile/logout-all'),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getEmployees: (params) => api.get('/users/employees', { params }),
  getAdmins: () => api.get('/users/admins'),
};

export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  getPublic: () => api.get('/departments/public'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  addEmployee: (id, employeeId) => api.post(`/departments/${id}/employees`, { employeeId }),
  removeEmployee: (id, employeeId) => api.delete(`/departments/${id}/employees/${employeeId}`),
};

export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (formData) => api.post('/projects', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  pickup: (id) => api.post(`/projects/${id}/pickup`),
  updateProgress: (id, formData) => api.post(`/projects/${id}/progress`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitForReview: (id) => api.post(`/projects/${id}/submit-review`),
  approve: (id, notes) => api.post(`/projects/${id}/approve`, { notes }),
  reject: (id, notes) => api.post(`/projects/${id}/reject`, { notes }),
  getProgressLogs: (id) => api.get(`/projects/${id}/progress-logs`),
  getSecureDownloadUrl: (id) => api.get(`/projects/${id}/download-secure`),
  getDownloadLogs: (id) => api.get(`/projects/${id}/download-logs`),
};

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getAdminPerformance: () => api.get('/analytics/admin-performance'),
  getEmployeePerformance: () => api.get('/analytics/employee-performance'),
  getDepartmentPerformance: () => api.get('/analytics/department-performance'),
  getActivityLogs: (params) => api.get('/analytics/activity-logs', { params }),
  getAdminDashboard: () => api.get('/analytics/admin-dashboard'),
  getEmployeeDashboard: () => api.get('/analytics/employee-dashboard'),
  getNotifications: (params) => api.get('/analytics/notifications', { params }),
  markNotificationRead: (id) => api.put(`/analytics/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/analytics/notifications/read-all'),
  getWhatsAppLog: () => api.get('/analytics/whatsapp-log'),
};
