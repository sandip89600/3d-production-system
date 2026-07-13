import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, KeyRound, ChevronLeft, Shield } from 'lucide-react';
import { authAPI } from '../../../api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [resetMethod, setResetMethod] = useState('email'); // 'email' | 'mobile'
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      return toast.error(`${resetMethod === 'email' ? 'Email' : 'Mobile number'} is required`);
    }

    setLoading(true);
    try {
      if (resetMethod === 'email') {
        const { data } = await authAPI.forgotPasswordEmail(inputValue.trim());
        toast.success(data.message || 'OTP sent successfully!');
        navigate('/admin/verify-otp', { state: { target: inputValue.trim(), type: 'email' } });
      } else {
        const { data } = await authAPI.forgotPasswordMobile(inputValue.trim());
        toast.success(data.message || 'OTP sent successfully!');
        navigate('/admin/verify-otp', { state: { target: inputValue.trim(), type: 'mobile' } });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please check your input.';
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
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Forgot Password?</h2>
          <p className="text-slate-400 text-sm text-center mt-1">Select a recovery option to receive a 6-digit OTP</p>
        </div>

        {/* Toggle options */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-dark-950/60 rounded-2xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { setResetMethod('email'); setInputValue(''); }}
            className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              resetMethod === 'email'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => { setResetMethod('mobile'); setInputValue(''); }}
            className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              resetMethod === 'mobile'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Phone className="w-4 h-4" />
            Mobile
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">
              {resetMethod === 'email' ? 'Registered Email Address' : 'Registered Mobile Number'}
            </label>
            <div className="relative">
              <input
                type={resetMethod === 'email' ? 'email' : 'text'}
                className="input pl-11"
                placeholder={resetMethod === 'email' ? 'you@all3dstudio.com' : '+919876543210'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                required
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {resetMethod === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              {resetMethod === 'email'
                ? 'We will send a 6-digit OTP code to this email to verify your identity.'
                : 'Enter your phone number in full international format (e.g., +919876543210).'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP Code'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="flex items-center justify-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mx-auto"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
