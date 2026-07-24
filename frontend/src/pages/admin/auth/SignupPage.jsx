import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Eye, EyeOff, Boxes, Shield, Zap, Lock, User, Mail, Phone, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    category: '', // 'admin' or 'employee'
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.mobile || !form.category || !form.password) {
      toast.error('All fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        role: form.category, // admin or employee
      });

      toast.success('Registration successful! Please log in.');
      navigate(`/${form.category}/login`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Check your details.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex animate-fade-in">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-dark-950 to-purple-900/30" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.15) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

        <div className="relative flex flex-col justify-center items-center h-full p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-8">
            <Boxes className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            All3DStudio<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Staff Portal</span>
          </h1>
          <p className="text-slate-400 text-lg mb-12 max-w-md leading-relaxed">
            Register your profile to access workspace tools
          </p>

          <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
            {[
              { icon: Shield, label: 'Secure Verification', desc: 'Administrative audit logs' },
              { icon: Zap, label: 'Real-time Workspace', desc: 'Real-time update stream' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card p-4 flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-8 py-12 bg-dark-900/50 backdrop-blur-sm border-l border-white/5 overflow-y-auto">
        <div className="max-w-sm w-full mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold">All3DStudio</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Create Staff Profile
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Register an account to start working in All3DStudio.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Rahul Kumar"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="rahul@all3dstudio.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="9876543210"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Account Category</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  required
                  className="input text-white"
                  style={{ paddingLeft: '2.5rem' }}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="" className="text-slate-800">Select Category</option>
                  <option value="admin" className="text-slate-800">Admin</option>
                  <option value="employee" className="text-slate-800">Employee</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating profile...
                </>
              ) : (
                'Create Profile'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/admin/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
