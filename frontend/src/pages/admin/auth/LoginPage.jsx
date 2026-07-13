import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Eye, EyeOff, Boxes, Shield, Zap, Lock } from 'lucide-react';
import { departmentsAPI, authAPI } from '../../../api';
import toast from 'react-hot-toast';

const roleRedirects = {
  superadmin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  employee: '/employee/dashboard',
};

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [twoFA, setTwoFA] = useState({ required: false, token: '000000' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword(forgotEmail);
      toast.success(data.message || 'Reset link logged to the console!');
      setForgotEmail('');
      setForgotPasswordMode(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request password reset';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const [departments, setDepartments] = useState([]);
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    adminCode: '',
  });

  useEffect(() => {
    if (isRegistering) {
      departmentsAPI.getPublic()
        .then(({ data }) => setDepartments(data.departments || []))
        .catch(() => toast.error('Failed to load departments'));
    }
  }, [isRegistering]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.email, form.password, twoFA.required ? twoFA.token : undefined);
      if (result?.requires2FA) {
        setTwoFA(t => ({ ...t, required: true }));
        toast('Enter your 2FA code', { icon: '🔐' });
      } else {
        toast.success(`Welcome back, ${result.user?.name?.split(' ')[0]}! 👋`);
        const fromPath = location.state?.from?.pathname || roleRedirects[result.user?.role] || '/';
        navigate(fromPath, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (regForm.role === 'employee' && !regForm.department) {
        toast.error('Please select a department');
        setLoading(false);
        return;
      }
      if (regForm.role === 'admin' && !regForm.adminCode) {
        toast.error('Please provide an Admin Code');
        setLoading(false);
        return;
      }

      const result = await register({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        role: regForm.role,
        department: regForm.role === 'employee' ? regForm.department : undefined,
        adminCode: regForm.role === 'admin' ? regForm.adminCode : undefined,
      });

      toast.success('Registration successful! Welcome to the studio. 🎉');
      const fromPath = location.state?.from?.pathname || roleRedirects[result.user?.role] || '/';
      navigate(fromPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-dark-950 flex animate-fade-in">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-dark-950 to-purple-900/30" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.15) 0%, transparent 50%)',
        }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

        <div className="relative flex flex-col justify-center items-center h-full p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-8">
            <Boxes className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            All3DStudio<br />
            <span className="gradient-text">Management System</span>
          </h1>
          <p className="text-slate-400 text-lg mb-12 max-w-md leading-relaxed">
            Enterprise-grade project management for professional All3DStudio artists
          </p>

          <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
            {[
              { icon: Shield, label: 'Enterprise Security', desc: 'JWT + 2FA + bcrypt encryption' },
              { icon: Zap, label: 'Real-time Tracking', desc: 'Live progress via WebSockets' },
              { icon: Lock, label: 'Role-based Access', desc: 'Granular permission control' },
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
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-8 py-12 bg-dark-900/50 backdrop-blur-sm border-l border-white/5">
        <div className="max-w-sm w-full mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold">All3DStudio</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {isRegistering ? 'Create an Account' : 'Welcome back'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isRegistering ? 'Join the All3DStudio team today' : 'Sign in to your account to continue'}
            </p>
          </div>

          {!isRegistering ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                    {!twoFA.required ? (
                      <>
                        <div>
                          <label className="label">Email Address</label>
                          <input
                            type="email"
                            className="input"
                            placeholder="you@all3dstudio.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label mb-0">Password</label>
                            <button
                              type="button"
                              onClick={() => navigate('/admin/forgot-password')}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Forgot Password?
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="input pr-12"
                              placeholder="••••••••"
                              value={form.password}
                              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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
                      </>
                    ) : (
                      <div>
                        <div className="glass-card p-4 mb-4 text-center">
                          <div className="text-3xl mb-2">🔐</div>
                          <p className="text-white font-semibold text-sm">Two-Factor Authentication</p>
                          <p className="text-slate-400 text-xs mt-1">Enter the 6-digit code from your authenticator app</p>
                        </div>
                        <label className="label">2FA Code</label>
                        <input
                          type="text"
                          className="input text-center text-2xl tracking-widest"
                          placeholder="000 000"
                          maxLength={6}
                          value={twoFA.token}
                          onChange={e => setTwoFA(t => ({ ...t, token: e.target.value.replace(/\D/g, '') }))}
                          required
                          autoFocus
                        />
                        <button type="button" onClick={() => setTwoFA({ required: false, token: '' })} className="text-slate-400 hover:text-white text-xs mt-2 transition-colors">
                          ← Back to login
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        twoFA.required ? 'Verify & Sign In' : 'Sign In'
                      )}
                    </button>
                  </form>

                  <div className="text-center mt-4">
                    <p className="text-slate-400 text-xs">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsRegistering(true)}
                        className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                      >
                        Create Account
                      </button>
                    </p>
                  </div>


            </>
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="John Doe"
                    value={regForm.name}
                    onChange={e => setRegForm(rf => ({ ...rf, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@3dprod.com"
                    value={regForm.email}
                    onChange={e => setRegForm(rf => ({ ...rf, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={regForm.password}
                    onChange={e => setRegForm(rf => ({ ...rf, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select
                    className="input"
                    value={regForm.role}
                    onChange={e => setRegForm(rf => ({ ...rf, role: e.target.value }))}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {regForm.role === 'employee' ? (
                  <div>
                    <label className="label">Department</label>
                    <select
                      className="input"
                      value={regForm.department}
                      onChange={e => setRegForm(rf => ({ ...rf, department: e.target.value }))}
                      required
                    >
                      <option value="">Select a Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="label">Admin Code</label>
                    <input
                      type="text"
                      className="input uppercase"
                      placeholder="e.g. ROH"
                      maxLength={3}
                      value={regForm.adminCode}
                      onChange={e => setRegForm(rf => ({ ...rf, adminCode: e.target.value.toUpperCase() }))}
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register & Join'
                  )}
                </button>
              </form>

              <div className="text-center mt-4">
                <p className="text-slate-400 text-xs">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
