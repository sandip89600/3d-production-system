import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, Briefcase, Boxes, ArrowRight, ArrowLeft, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import SEO from '../../components/public/SEO';
import GoogleAuthButton from '../../components/public/GoogleAuthButton';
import toast from 'react-hot-toast';

export default function Signup() {
  const { register, signupWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    mobile: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  // Password Checklist State Calculation
  const pwdChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[@$!%*?&#.\-_]/.test(form.password),
  };
  const strengthCount = Object.values(pwdChecks).filter(Boolean).length;

  const getStrengthLabel = () => {
    if (strengthCount <= 1) return { label: 'Very Weak', color: 'bg-red-500' };
    if (strengthCount === 2) return { label: 'Weak', color: 'bg-orange-500' };
    if (strengthCount === 3) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strengthCount === 4) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
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
      const result = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'client',
        companyName: form.companyName,
        mobile: form.mobile,
      });

      if (result.pendingVerification) {
        setPendingVerification(true);
        setVerificationMessage(result.message);
        toast.success('Registration pending. Verify email!');
      } else {
        toast.success('Welcome to All 3D Studio!');
        navigate('/client/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Check details.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    try {
      await signupWithGoogle(credential);
      toast.success('Sign up successful! Welcome to All 3D Studio.');
      navigate('/client/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google signup failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <SEO title="Verification Required" description="Verify your email to continue." />
        <div className="w-full max-w-md bg-[#0b101c]/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md relative z-10">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Inbox</h2>
          <p className="text-slate-450 text-sm mb-6 leading-relaxed">
            {verificationMessage || 'A verification link has been sent to your email address. Please click the link inside to verify and activate your workspace.'}
          </p>
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl border border-slate-800 transition-colors"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
      <SEO 
        title="Client Registration" 
        description="Register a client account at All 3D Studio Noida to submit design briefs, track rendering progress, and download high-definition rendering deliverables." 
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Client Registration', path: '/signup' }]}
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

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }} />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-4">
            <Boxes className="w-6.5 h-6.5 text-slate-950" />
          </Link>
          <h2 className="text-2xl font-black text-white tracking-tight">Create Client Account</h2>
          <p className="text-xs text-slate-450 mt-1">Review drafts, manage project assets, and log revision briefs</p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="bg-[#0b101c]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Miller"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. john@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Miller Studios"
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-2 p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Password Strength</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${strength.color} text-slate-950`}>
                      {strength.label}
                    </span>
                  </div>
                  {/* Grid Bars */}
                  <div className="grid grid-cols-5 gap-1.5 h-1">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <div
                        key={index}
                        className={`h-full rounded-full transition-colors ${
                          index <= strengthCount ? strength.color : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Criteria Checklist */}
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
                    {[
                      { check: pwdChecks.length, text: 'Min 8 Characters' },
                      { check: pwdChecks.upper, text: '1 Uppercase' },
                      { check: pwdChecks.lower, text: '1 Lowercase' },
                      { check: pwdChecks.number, text: '1 Number' },
                      { check: pwdChecks.special, text: '1 Special Character' },
                    ].map(({ check, text }) => (
                      <div key={text} className="flex items-center gap-1.5">
                        {check ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        )}
                        <span className={check ? 'text-slate-300' : 'text-slate-500'}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Signup */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-850"></div>
              <span className="flex-shrink mx-4 text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Or</span>
              <div className="flex-grow border-t border-slate-850"></div>
            </div>

            <GoogleAuthButton onSuccess={handleGoogleSuccess} text="signup_with" />

          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
            Login here
          </Link>
        </p>

      </div>

    </div>
  );
}
