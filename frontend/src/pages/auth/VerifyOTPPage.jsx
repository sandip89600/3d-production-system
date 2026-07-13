import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';

export default function VerifyOTPPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const target = location.state?.target || '';
  const type = location.state?.type || 'email'; // 'email' | 'mobile'

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no target was passed in state
  useEffect(() => {
    if (!target) {
      toast.error('Session expired. Please request a new OTP.');
      navigate('/admin/forgot-password');
    }
  }, [target, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const maskTarget = (val, methodType) => {
    if (!val) return '';
    if (methodType === 'email') {
      const [local, domain] = val.split('@');
      if (local.length <= 2) return `${local[0]}*@${domain}`;
      return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
    } else {
      if (val.length <= 6) return val;
      return `${val.slice(0, 3)}${'*'.repeat(val.length - 7)}${val.slice(-4)}`;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (element, index) => {
    const val = element.value.replace(/\D/g, ''); // Numeric only
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    // Distribute value if user entered more than 1 char (e.g. paste)
    if (val.length > 1) {
      const digits = val.split('').slice(0, 6);
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      // Focus the last input or the next empty
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = val;
      setOtp(newOtp);
      // Focus next input
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Focus previous input if current is empty and backspace pressed
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').split('').slice(0, 6);
    if (pasteData.length === 6) {
      setOtp(pasteData);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      if (type === 'email') {
        const { data } = await authAPI.forgotPasswordEmail(target);
        toast.success(data.message || 'New OTP sent to email.');
      } else {
        const { data } = await authAPI.forgotPasswordMobile(target);
        toast.success(data.message || 'New OTP sent to mobile.');
      }
      setTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      return toast.error('Please enter the 6-digit OTP code.');
    }

    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP(target, otpString);
      toast.success('OTP verified successfully!');
      // Navigate to reset password page and pass the token in location state
      navigate('/admin/reset-password', { state: { resetToken: data.resetToken } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Try again.';
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-blue-500/30">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Verify Identity</h2>
          <p className="text-slate-400 text-sm text-center mt-1 leading-relaxed">
            We have sent a 6-digit OTP to<br />
            <span className="font-semibold text-slate-200">{maskTarget(target, type)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Digit Input Boxes */}
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1}
                className="w-12 h-14 text-center text-2xl font-bold text-white bg-dark-950/60 rounded-xl border border-white/10 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all select-all outline-none"
              />
            ))}
          </div>

          {/* Timer Display */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">OTP expires in:</span>
            {timeLeft > 0 ? (
              <span className="font-semibold text-amber-400 animate-pulse">{formatTime(timeLeft)}</span>
            ) : (
              <span className="font-semibold text-red-500">Expired</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || timeLeft <= 0}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying OTP...
              </>
            ) : (
              'Verify & Proceed'
            )}
          </button>

          {/* Resend and back navigation */}
          <div className="flex flex-col gap-4 items-center">
            <button
              type="button"
              disabled={timeLeft > 0 || resending}
              onClick={handleResend}
              className={`flex items-center gap-2 text-sm transition-colors ${
                timeLeft > 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-blue-400 hover:text-blue-300 hover:underline'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              Resend OTP Code {timeLeft > 0 ? `(wait ${formatTime(timeLeft)})` : ''}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/forgot-password')}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Use a different recovery option
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
