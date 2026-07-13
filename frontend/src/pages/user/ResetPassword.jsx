import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../api';
import { Eye, EyeOff, Lock, CheckCircle2, ShieldAlert, Boxes, Check, X, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Retrieve token from state or search param
  const token = location.state?.resetToken || searchParams.get('token');

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
      toast.error('Reset token is missing or has expired.');
      return;
    }
    if (!allRequirementsMet) {
      toast.error('Please satisfy all password strength requirements.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      toast.success('Password reset successfully!');
      // Navigate to login
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. The link or token may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-4">
            <Boxes className="w-6.5 h-6.5 text-slate-950" />
          </Link>
          <h2 className="text-2xl font-black text-white tracking-tight">Configure New Password</h2>
          <p className="text-xs text-slate-450 mt-1">Set a highly secure password for your All 3D Studio account</p>
        </div>

        {/* Card */}
        <div className="bg-[#0b101c]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {!token ? (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-12 h-12 rounded-full bg-red-950/40 text-red-550 flex items-center justify-center border border-red-900/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Reset Token Missing</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed">
                  The password reset token is missing, expired, or invalid. Please request a new link.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors hover:bg-amber-400 mt-2"
              >
                Request New Code
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5.5">
              
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password strength indicators */}
              <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-900 flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-550 font-bold mb-1">Security Requirements</p>
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {req.satisfied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-red-500/50 flex-shrink-0" />
                    )}
                    <span className={req.satisfied ? 'text-slate-350' : 'text-slate-550'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !allRequirementsMet}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}
        </div>

        {/* Back Link */}
        <p className="text-center mt-6 text-xs text-slate-400">
          Return to{' '}
          <Link to="/login" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
            Login here
          </Link>
        </p>

      </div>

    </div>
  );
}
