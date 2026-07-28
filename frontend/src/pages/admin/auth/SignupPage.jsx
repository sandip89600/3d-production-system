import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Eye, EyeOff, Boxes, Shield, Zap, Lock, User, Mail, Phone, Users, Landmark, ArrowRight, AlertTriangle } from 'lucide-react';
import { departmentsAPI, authAPI } from '../../../api';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const isUrlAdmin = window.location.pathname.includes('/admin/signup');
  const isUrlEmployee = window.location.pathname.includes('/employee/signup');
  const isUrlDeveloper = window.location.pathname.includes('/developer/signup');

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    category: isUrlAdmin ? 'admin' : (isUrlEmployee ? 'employee' : ''), // 'admin' or 'employee'
    department: '',
    password: '',
    confirmPassword: '',
  });

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [adminCountData, setAdminCountData] = useState({ count: 0, limit: 3, canCreate: true });

  useEffect(() => {
    const fetchAdminCount = async () => {
      try {
        const { data } = await authAPI.getAdminCount();
        setAdminCountData(data);
      } catch (err) {
        console.error('Failed to load admin count:', err);
      }
    };
    fetchAdminCount();
  }, []);

  useEffect(() => {
    if (form.category === 'employee') {
      const fetchDepts = async () => {
        setLoadingDepts(true);
        try {
          const { data } = await departmentsAPI.getPublic();
          setDepartments(data.departments || []);
        } catch (err) {
          toast.error('Failed to load departments.');
        } finally {
          setLoadingDepts(false);
        }
      };
      fetchDepts();
    } else {
      setForm(prev => ({ ...prev, department: '' }));
    }
  }, [form.category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.mobile || !form.category || !form.password) {
      toast.error('All fields are required.');
      return;
    }
    if (form.category === 'employee' && !form.department) {
      toast.error('Department selection is mandatory for employees.');
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
      const result = await register({
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        role: form.category, // admin or employee
        department: form.category === 'employee' ? form.department : undefined,
      });

      if (result.pendingVerification) {
        setPendingVerification(true);
        setVerificationMessage(result.message);
        toast.success('Registration successful. Verify your email!');
      } else {
        toast.success('Registration successful!');
        const roleRedirects = {
          admin: '/admin/dashboard',
          employee: '/employee/dashboard',
        };
        navigate(roleRedirects[form.category] || '/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Check your details.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isUrlDeveloper) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="w-full max-w-md bg-dark-900 border border-white/5 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md relative z-10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Restricted</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Super Admin (Developer) registration is restricted for security. Please sign in or contact the system administrator.
          </p>
          <Link
            to="/developer/login"
            className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <span>Go to Developer Login</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="w-full max-w-md bg-dark-900 border border-white/5 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md relative z-10">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Inbox</h2>
          <p className="text-slate-450 text-sm mb-6 leading-relaxed">
            {verificationMessage || 'A verification link has been sent to your email address. Please check your inbox and verify your account to activate your workspace.'}
          </p>
          <Link
            to="/admin/login"
            className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

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
                  className="input text-white disabled:opacity-75 disabled:cursor-not-allowed"
                  style={{ paddingLeft: '2.5rem' }}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  disabled={isUrlAdmin || isUrlEmployee}
                >
                  <option value="" className="text-slate-800">Select Category</option>
                  <option value="admin" className="text-slate-800">Admin</option>
                  <option value="employee" className="text-slate-800">Employee</option>
                </select>
              </div>
            </div>

            {form.category === 'admin' && adminCountData.count >= 3 && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2 items-start leading-relaxed my-3 animate-fade-in">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Admin Account Limit Reached</p>
                  <p className="mt-0.5">Maximum limit of 3 Admin accounts has been reached. You cannot create a new Admin account at this time.</p>
                </div>
              </div>
            )}

            {form.category === 'employee' && (
              <div>
                <label className="label">Department</label>
                <div className="relative">
                  <Landmark className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    required
                    className="input text-white"
                    style={{ paddingLeft: '2.5rem' }}
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    disabled={loadingDepts}
                  >
                    <option value="" className="text-slate-800">
                      {loadingDepts ? 'Loading departments...' : 'Select Department'}
                    </option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id} className="text-slate-800">
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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

            {!(form.category === 'admin' && adminCountData.count >= 3) ? (
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
            ) : (
              <div className="text-center text-xs font-semibold text-red-400 mt-4 p-3.5 bg-red-500/5 rounded-xl border border-red-500/10">
                Signup is disabled due to admin limit (3/3).
              </div>
            )}
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
