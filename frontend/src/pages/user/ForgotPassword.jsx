import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import { Mail, Phone, Lock, Boxes, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('email'); // 'email' or 'mobile'
  const [inputValue, setInputValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!inputValue) return;
    setLoading(true);
    try {
      if (method === 'email') {
        await authAPI.forgotPasswordEmail(inputValue);
        toast.success('Reset OTP sent to your email! Check spam/inbox.');
      } else {
        await authAPI.forgotPasswordMobile(inputValue);
        toast.success('Reset OTP sent to your mobile number!');
      }
      setOtpSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to dispatch reset request.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP(inputValue, otpCode);
      toast.success('OTP Verified successfully!');
      // Navigate to reset password page, passing target resetToken
      navigate('/reset-password', { state: { resetToken: data.resetToken } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP code.';
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
          <h2 className="text-2xl font-black text-white tracking-tight">Recovery Services</h2>
          <p className="text-xs text-slate-450 mt-1">
            {!otpSent ? 'Enter details to receive security credentials' : 'Verify OTP details to configure credentials'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0b101c]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-5.5">
              
              {/* Toggle Method */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-900">
                <button
                  type="button"
                  onClick={() => { setMethod('email'); setInputValue(''); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    method === 'email' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Email Recovery
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod('mobile'); setInputValue(''); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    method === 'mobile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Mobile SMS
                </button>
              </div>

              {/* Input details */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  {method === 'email' ? 'Email Address' : 'Mobile Number'}
                </label>
                <div className="relative">
                  {method === 'email' ? (
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  )}
                  <input
                    type={method === 'email' ? 'email' : 'tel'}
                    required
                    placeholder={method === 'email' ? 'e.g. client@domain.com' : 'e.g. +919876543210'}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-1 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-5.5">
              
              {/* Success Notification Alert */}
              <div className="flex gap-3 bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-2xl text-emerald-450 text-xs leading-relaxed">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Code Dispatched!</p>
                  <p className="text-slate-400">Please enter the 6-digit OTP code sent to <strong>{inputValue}</strong>.</p>
                </div>
              </div>

              {/* OTP Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">6-Digit OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1em] text-lg font-bold bg-slate-900/40 border border-slate-800 rounded-xl py-3 text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Submit OTP */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-1 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 font-semibold cursor-pointer"
              >
                Change Email / Number
              </button>

            </form>
          )}
        </div>

        {/* Footer actions */}
        <p className="text-center mt-6 text-xs text-slate-400">
          Remember credentials?{' '}
          <Link to="/login" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
            Login here
          </Link>
        </p>

      </div>

    </div>
  );
}
