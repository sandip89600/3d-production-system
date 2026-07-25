import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Boxes, ArrowRight, ArrowLeft } from 'lucide-react';
import SEO from '../../components/public/SEO';
import GoogleAuthButton from '../../components/public/GoogleAuthButton';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      const userRole = result.user?.role;

      if (userRole !== 'client') {
        await logout();
        toast.error(`Staff detected. Please login at the dedicated /${userRole}/login portal.`);
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${result.user?.name?.split(' ')[0] || 'User'}! 👋`);
      const fromPath = location.state?.from?.pathname || '/client/dashboard';
      navigate(fromPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    try {
      const result = await loginWithGoogle(credential);
      const userRole = result.user?.role;

      if (userRole !== 'client') {
        await logout();
        toast.error(`Staff detected. Please login at the dedicated /${userRole}/login portal.`);
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${result.user?.name?.split(' ')[0] || 'User'}! 👋`);
      const fromPath = location.state?.from?.pathname || '/dashboard';
      navigate(fromPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Google login failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
      <SEO 
        title="Client Login" 
        description="Log in to your All 3D Studio client workspace to review blueprints, track rendering progress, and download deliverables." 
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Client Login', path: '/login' }]}
      />
      
      {/* Floating Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-850 border border-slate-850 px-4 py-2.5 rounded-xl transition-all duration-300 backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Dynamic Background elements */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo teaser */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-4">
            <Boxes className="w-6.5 h-6.5 text-slate-950" />
          </Link>
          <h2 className="text-2xl font-black text-white tracking-tight">Login to All 3D Studio</h2>
          <p className="text-xs text-slate-450 mt-1">Access your client renderings and visual brief scheduler</p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="bg-[#0b101c]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5.5">
            
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. client@domain.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">Password</label>
                <Link to="/forgot-password" className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
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

            {/* Remember Me checkbox */}
            <div className="flex items-center gap-2 select-none">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4.5 h-4.5 rounded bg-slate-900 border border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer">
                Remember my session
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-1 cursor-pointer active:scale-98 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Social Logins */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-850"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Or continue with</span>
              <div className="flex-grow border-t border-slate-850"></div>
            </div>

            <GoogleAuthButton onSuccess={handleGoogleSuccess} text="continue_with" />

          </form>
        </div>

        {/* Footer actions */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>
            New client?{' '}
            <Link to="/signup" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>

      </div>

    </div>
  );
}
