import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../../../api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import SEO from '../../../components/public/SEO';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setTimeout(() => {
        setStatus('error');
        setMessage('Verification token is missing. Please check your verification email link.');
      }, 0);
      return;
    }

    const verify = async () => {
      try {
        const { data } = await authAPI.verifyEmail(token);
        setTimeout(() => {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! You can now log in.');
        }, 0);
      } catch (err) {
        setTimeout(() => {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
        }, 0);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <SEO 
        title="Email Verification" 
        description="Verify your email address to activate your All 3D Studio account." 
      />
      
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0b101c]/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-xl font-extrabold text-white tracking-tight">All 3D Studio</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Activation Portal</p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
            <h2 className="text-lg font-bold text-white mb-1">Verifying Email</h2>
            <p className="text-slate-450 text-xs">Connecting to activation servers...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              {message}
            </p>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/10"
            >
              <span>Login to Account</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-4 animate-fade-in">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              {message}
            </p>
            <Link
              to="/signup"
              className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl border border-slate-800 transition-colors"
            >
              <span>Back to Signup</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
