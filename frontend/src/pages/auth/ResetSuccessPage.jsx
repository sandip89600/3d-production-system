import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function ResetSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-radial-dark flex items-center justify-center p-4">
      {/* Decorative background blur objects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass-card max-w-md w-full p-8 relative overflow-hidden text-center animate-fade-in">
        {/* Animated circular success checkmark */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10 animate-bounce">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
        <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed mb-8">
          Your password has been changed successfully. You can now sign in to your account with your new credentials.
        </p>

        <button
          onClick={() => navigate('/admin/login')}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          Proceed to Login
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
