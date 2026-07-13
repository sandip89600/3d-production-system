import React, { useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../../api';
import { Eye, EyeOff, KeyRound, Check, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get token from URL search query (?token=...) or from location state (VerifyOTPPage redirect)
  const token = searchParams.get('token') || location.state?.resetToken;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password requirements checklist
  const requirements = [
    { label: 'At least 8 characters long', satisfied: password.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', satisfied: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter (a-z)', satisfied: /[a-z]/.test(password) },
    { label: 'At least one number (0-9)', satisfied: /\d/.test(password) },
    { label: 'At least one special character (@$!%*?&)', satisfied: /[@$!%*?&]/.test(password) },
  ];

  const allRequirementsMet = requirements.every(req => req.satisfied);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      return toast.error('Reset token is missing or has expired.');
    }
    if (!allRequirementsMet) {
      return toast.error('Please satisfy all password strength requirements.');
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword({ token, password });
      toast.success(data.message || 'Password changed successfully!');
      navigate('/admin/reset-success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. The link or token may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial-dark flex items-center justify-center p-4">
      {/* Decorative background blur objects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass-card max-w-md w-full p-8 relative overflow-hidden animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Reset Password</h2>
          <p className="text-slate-400 text-sm text-center mt-1">Enter your new secure account password</p>
        </div>

        {!token ? (
          <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm leading-relaxed">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <p className="font-semibold mb-1">Invalid Reset Token</p>
            <p className="text-slate-400 text-xs mb-4">The password reset token is missing. Please start the forgot password recovery process again.</p>
            <button
              type="button"
              onClick={() => navigate('/admin/forgot-password')}
              className="btn-secondary w-full"
            >
              Start Recovery Over
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password strength checklist */}
            <div className="p-4 bg-dark-950/60 rounded-2xl border border-white/5 space-y-2 text-xs">
              <p className="font-semibold text-slate-400 mb-2">Password Requirements:</p>
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                    req.satisfied
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : 'border-white/10 text-slate-600'
                  }`}>
                    {req.satisfied ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                  </div>
                  <span className={req.satisfied ? 'text-slate-300 font-medium' : 'text-slate-500'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {password && confirmPassword && (
              <p className={`text-xs ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !allRequirementsMet || password !== confirmPassword}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6 py-3 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Save New Password'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="text-slate-400 hover:text-white text-xs mt-2 transition-colors block text-center w-full"
            >
              Cancel and go to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
