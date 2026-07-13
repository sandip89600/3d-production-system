import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, authAPI } from '../api';
import Layout from '../components/Layout';
import {
  User, Lock, Shield, Activity, Bell, KeyRound, Upload, Trash, Plus, X,
  Briefcase, Calendar, MapPin, AlertOctagon, LogOut, Settings, Mail, Phone,
  ShieldAlert, Check, Users, Folder, LineChart, Percent, CheckCircle2, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'stats' | 'security' | 'preferences' | 'activity'
  const [loading, setLoading] = useState(true);

  // Profile Details Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    emergencyContact: { name: '', relation: '', mobile: '' },
    skills: [],
    experience: 0
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA Setup State
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [loading2FA, setLoading2FA] = useState(false);

  // 2FA Disable State
  const [disableMode, setDisableMode] = useState(false);
  const [disableToken, setDisableToken] = useState('');

  // Photo Upload State
  const [photoLoading, setPhotoLoading] = useState(false);

  // Preferences State
  const [notifSettings, setNotifSettings] = useState({
    email: true,
    whatsapp: true,
    system: true,
    deadlineAlerts: true
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'team',
    contactVisibility: 'team',
    activityVisibility: 'team'
  });

  // Activity Log Tab Pagination
  const [activitiesList, setActivitiesList] = useState([]);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesTotalPages, setActivitiesTotalPages] = useState(1);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Load profile data on mount
  const fetchProfileData = async () => {
    try {
      const { data } = await profileAPI.getProfile();
      setUser(data.user);
      setStatistics(data.statistics || {});
      setRecentActivities(data.recentActivities || []);
      
      // Initialize forms
      setProfileForm({
        name: data.user.name || '',
        email: data.user.email || '',
        mobile: data.user.mobile || '',
        address: data.user.address || '',
        emergencyContact: {
          name: data.user.emergencyContact?.name || '',
          relation: data.user.emergencyContact?.relation || '',
          mobile: data.user.emergencyContact?.mobile || ''
        },
        skills: data.user.skills || [],
        experience: data.user.experience || 0
      });
      
      setNotifSettings({
        email: data.user.notificationSettings?.email ?? true,
        whatsapp: data.user.notificationSettings?.whatsapp ?? true,
        system: data.user.notificationSettings?.system ?? true,
        deadlineAlerts: data.user.notificationSettings?.deadlineAlerts ?? true
      });

      setPrivacySettings({
        profileVisibility: data.user.privacySettings?.profileVisibility || 'team',
        contactVisibility: data.user.privacySettings?.contactVisibility || 'team',
        activityVisibility: data.user.privacySettings?.activityVisibility || 'team'
      });

      setLoading(false);
    } catch (err) {
      toast.error('Failed to load profile data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Fetch paginated activities when tab changes or page changes
  useEffect(() => {
    if (activeTab === 'activity') {
      const fetchActivities = async () => {
        setActivitiesLoading(true);
        try {
          const { data } = await profileAPI.getActivity(activitiesPage);
          setActivitiesList(data.activities || []);
          setActivitiesTotalPages(data.totalPages || 1);
        } catch (err) {
          toast.error('Failed to fetch activity log');
        } finally {
          setActivitiesLoading(false);
        }
      };
      fetchActivities();
    }
  }, [activeTab, activitiesPage]);

  // Image upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Profile photo must be less than 2MB');
    }

    const formData = new FormData();
    formData.append('photo', file);

    setPhotoLoading(true);
    try {
      const { data } = await profileAPI.uploadPhoto(formData);
      toast.success('Profile photo uploaded! 📸');
      setUser(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
      updateUser({ profilePhoto: data.profilePhoto });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload photo';
      toast.error(msg);
    } finally {
      setPhotoLoading(false);
    }
  };

  // Image remove handler
  const handlePhotoRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setPhotoLoading(true);
    try {
      await profileAPI.removePhoto();
      toast.success('Profile photo removed.');
      setUser(prev => ({ ...prev, profilePhoto: null }));
      updateUser({ profilePhoto: null });
    } catch (err) {
      toast.error('Failed to remove photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  // Profile details update submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        ...profileForm,
        notificationSettings: notifSettings,
        privacySettings
      };
      const { data } = await profileAPI.updateProfile(payload);
      toast.success('Profile updated successfully! ✨');
      setUser(data.user);
      updateUser(data.user);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  // Skill management
  const addSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (profileForm.skills.includes(newSkill.trim())) {
      return toast.error('Skill already exists');
    }
    setProfileForm(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()]
    }));
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Password update submit
  const passwordRequirements = [
    { label: 'At least 8 characters', satisfied: passwordForm.newPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)', satisfied: /[A-Z]/.test(passwordForm.newPassword) },
    { label: 'One lowercase letter (a-z)', satisfied: /[a-z]/.test(passwordForm.newPassword) },
    { label: 'One number (0-9)', satisfied: /\d/.test(passwordForm.newPassword) },
    { label: 'One special character (@$!%*?&)', satisfied: /[@$!%*?&]/.test(passwordForm.newPassword) }
  ];
  const allPasswordReqsMet = passwordRequirements.every(req => req.satisfied);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (!allPasswordReqsMet) {
      return toast.error('Please meet all password requirements');
    }

    setPasswordLoading(true);
    try {
      await profileAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated successfully! 🔑');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // 2FA Setup
  const start2FASetup = async () => {
    setLoading2FA(true);
    try {
      const { data } = await authAPI.setup2FA();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (err) {
      toast.error('Failed to initiate 2FA setup');
    } finally {
      setLoading2FA(false);
    }
  };

  const confirm2FA = async (e) => {
    e.preventDefault();
    setLoading2FA(true);
    try {
      await authAPI.verify2FA(verifyToken);
      setUser(prev => ({ ...prev, twoFactorEnabled: true }));
      updateUser({ twoFactorEnabled: true });
      toast.success('Two-Factor Authentication activated! 🔐');
      setSetupMode(false);
      setVerifyToken('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid code';
      toast.error(msg);
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setLoading2FA(true);
    try {
      await authAPI.disable2FA(disableToken);
      setUser(prev => ({ ...prev, twoFactorEnabled: false }));
      updateUser({ twoFactorEnabled: false });
      toast.success('Two-Factor Authentication disabled');
      setDisableMode(false);
      setDisableToken('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid code';
      toast.error(msg);
    } finally {
      setLoading2FA(false);
    }
  };

  // Logout all other sessions
  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to log out from all other devices? This will invalidate all active sessions except this one.')) return;
    try {
      await profileAPI.logoutAllDevices();
      toast.success('Logged out from all other devices successfully! 💻');
    } catch (err) {
      toast.error('Failed to log out other devices');
    }
  };

  if (loading) {
    return (
      <Layout title="My Profile" subtitle="Manage your platform profile and preferences">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading profile data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const roleLabels = {
    superadmin: 'Developer',
    admin: 'Department Admin',
    employee: '3D Artist / Employee',
  };

  const getInitials = (n) => {
    return n ? n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : 'U';
  };

  return (
    <Layout title="My Profile" subtitle="Manage your profile dashboard, statistics, preferences, and account security settings">
      <div className="flex flex-col gap-6 animate-fade-in">
        
        {/* Profile Header Dashboard Card */}
        <div className="glass-card p-6 flex flex-col md:flex-row items-center md:items-start gap-6 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          {/* Profile Photo Area */}
          <div className="relative group flex-shrink-0">
            {photoLoading && (
              <div className="absolute inset-0 bg-dark-950/60 rounded-3xl z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
            {user.profilePhoto ? (
              <img
                src={`http://localhost:5000${user.profilePhoto}`}
                alt={user.name}
                className="w-28 h-28 rounded-3xl object-cover border border-white/10 shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/10 border border-white/15">
                {getInitials(user.name)}
              </div>
            )}
            {/* Overlay controls */}
            <div className="absolute -bottom-2 -right-2 flex gap-1.5 z-10">
              <label className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 border border-white/10 flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-90">
                <Upload className="w-3.5 h-3.5 text-white" />
                <input type="file" onChange={handlePhotoUpload} accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" />
              </label>
              {user.profilePhoto && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="w-8 h-8 rounded-xl bg-red-500/20 hover:bg-red-500/80 border border-red-500/30 hover:border-red-500/50 flex items-center justify-center shadow-lg transition-all active:scale-90 group/btn"
                >
                  <Trash className="w-3.5 h-3.5 text-red-400 group-hover/btn:text-white" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2.5">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
              <h2 className="text-2xl font-bold text-white leading-none">{user.name}</h2>
              <div className="flex items-center gap-1.5 justify-center">
                <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 rounded-full font-bold uppercase tracking-wider">
                  {roleLabels[user.role]}
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider border ${
                  user.accountStatus === 'active'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {user.accountStatus}
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
              {user.role === 'employee' ? `${user.department?.name || '3D Modeling'} Artist` : 'Platform Administrator'}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-left">
              <div className="bg-white/2 p-2.5 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Employee ID</p>
                <p className="text-xs text-slate-300 font-mono font-medium truncate">{user._id}</p>
              </div>
              <div className="bg-white/2 p-2.5 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Department</p>
                <p className="text-xs text-slate-300 truncate">{user.department?.name || 'General'}</p>
              </div>
              <div className="bg-white/2 p-2.5 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Joining Date</p>
                <p className="text-xs text-slate-300 truncate">{new Date(user.joiningDate || user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="bg-white/2 p-2.5 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Manager</p>
                <p className="text-xs text-slate-300 truncate">{user.role === 'superadmin' ? 'N/A' : 'System Owner'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector Links */}
        <div className="flex border-b border-white/10 gap-6 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Overview & Info', icon: User },
            { id: 'stats', label: 'Statistics', icon: LineChart },
            { id: 'security', label: 'Security & Sessions', icon: Shield },
            { id: 'preferences', label: 'Preferences', icon: Settings },
            { id: 'activity', label: 'Activity Log', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 border-b-2 text-sm font-semibold transition-all flex-shrink-0 outline-none ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        <div className="tab-container">
          
          {/* 1. OVERVIEW & INFO TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <form onSubmit={handleProfileSubmit} className="lg:col-span-2 space-y-6">
                
                {/* Personal Information Form */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/5 pb-3">
                    <User className="w-4 h-4 text-blue-400" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name</label>
                      <input
                        type="text"
                        className="input"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Email Address</label>
                      <input
                        type="email"
                        className="input"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Mobile Number</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="+91 98765 43210"
                        value={profileForm.mobile}
                        onChange={(e) => setProfileForm(p => ({ ...p, mobile: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Years of Experience</label>
                      <input
                        type="number"
                        className="input"
                        min="0"
                        value={profileForm.experience}
                        onChange={(e) => setProfileForm(p => ({ ...p, experience: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Residential Address</label>
                      <textarea
                        className="input min-h-[80px]"
                        placeholder="Your residential street, city, state and pincode"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Form */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/5 pb-3">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    Emergency Contact
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Contact Name</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Relation Name"
                        value={profileForm.emergencyContact.name}
                        onChange={(e) => setProfileForm(p => ({
                          ...p,
                          emergencyContact: { ...p.emergencyContact, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="label">Relationship</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Spouse, Parent, Brother"
                        value={profileForm.emergencyContact.relation}
                        onChange={(e) => setProfileForm(p => ({
                          ...p,
                          emergencyContact: { ...p.emergencyContact, relation: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="label">Mobile Number</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="+91 98765 43210"
                        value={profileForm.emergencyContact.mobile}
                        onChange={(e) => setProfileForm(p => ({
                          ...p,
                          emergencyContact: { ...p.emergencyContact, mobile: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-primary flex items-center justify-center gap-2 py-3 px-6"
                >
                  {profileSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    'Save Profile Details'
                  )}
                </button>
              </form>

              {/* Professional Skills Card */}
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <h3 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/5 pb-3">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    Professional Skills
                  </h3>
                  
                  {/* Skill Badge List */}
                  <div className="flex flex-wrap gap-2 min-h-[50px] p-2 bg-dark-950/40 rounded-xl border border-white/5">
                    {profileForm.skills.length === 0 ? (
                      <span className="text-slate-600 text-xs italic m-auto">No skills added yet. Add one below!</span>
                    ) : (
                      profileForm.skills.map((skill) => (
                        <span key={skill} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 rounded-lg font-medium flex items-center gap-1.5">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:bg-blue-500/30 rounded p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3 text-blue-400 hover:text-white" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add Skill Field */}
                  <form onSubmit={addSkill} className="flex gap-2">
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. V-Ray, Unreal Engine 5"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </form>
                  <p className="text-[10px] text-slate-500">Type a skill and click the + button to include it in your profile.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. STATISTICS TAB */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fade-in">
              {/* Employee Dashboard Stats */}
              {user.role === 'employee' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Total Assigned</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.totalAssigned || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Activity className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Active Projects</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.activeProjects || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Completed Projects</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.completedProjects || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Delayed Projects</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.delayedProjects || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 max-w-sm border border-white/5 flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-sm">Artist Performance Score</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Calculated based on projects delivered on time and ratings.</p>
                    </div>
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-xl flex-shrink-0">
                      {statistics.performanceScore || 100}%
                    </div>
                  </div>
                </>
              )}

              {/* Admin Dashboard Stats */}
              {user.role === 'admin' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Uploaded Projects</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.totalUploadedProjects || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Active Projects</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.activeProjects || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Completed Projects</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.completedProjects || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <LineChart className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">In Review Queue</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.reviewProjects || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 border border-white/5 max-w-md space-y-4">
                    <h4 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/5 pb-3">
                      <Users className="w-4 h-4 text-blue-400" />
                      Department Performance Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-white/2 rounded-xl">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Delivery Rate</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">{statistics.employeePerformanceSummary?.onTimeCompletionRate}%</p>
                      </div>
                      <div className="p-3 bg-white/2 rounded-xl">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Average Rating</p>
                        <p className="text-lg font-bold text-blue-400 mt-1">{statistics.employeePerformanceSummary?.averageRating}★</p>
                      </div>
                      <div className="p-3 bg-white/2 rounded-xl">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active Artists</p>
                        <p className="text-lg font-bold text-purple-400 mt-1">{statistics.employeePerformanceSummary?.activeArtists}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Super Admin Dashboard Stats */}
              {user.role === 'superadmin' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Total Users</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.totalUsers || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Departments</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.totalDepartments || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Total Projects</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.totalProjects || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">System Audit Logs</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.systemActivityCount || 0}</p>
                      </div>
                    </div>
                    <div className="glass-card p-5 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Security Incidents</p>
                        <p className="text-2xl font-bold text-white mt-0.5">{statistics.securityLogsCount || 0}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. SECURITY & SESSIONS TAB */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2 space-y-6">
                
                {/* 2FA Card Setup Container */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">Two-Factor Authentication (2FA)</h3>
                      <p className="text-slate-400 text-xs">Verify your login options</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Add an extra layer of security to your account by requiring a 6-digit verification code from Google Authenticator or Microsoft Authenticator whenever you log in.
                  </p>

                  {!user.twoFactorEnabled && !setupMode && (
                    <button
                      onClick={start2FASetup}
                      disabled={loading2FA}
                      className="btn-primary flex items-center gap-2"
                    >
                      {loading2FA ? 'Setting up...' : 'Setup Two-Factor 2FA'}
                    </button>
                  )}

                  {!user.twoFactorEnabled && setupMode && (
                    <div className="p-5 rounded-2xl bg-white/3 border border-white/5 space-y-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        {qrCode && (
                          <div className="p-3 bg-white rounded-xl shadow-lg flex-shrink-0">
                            <img src={qrCode} alt="2FA QR Code" className="w-36 h-36" />
                          </div>
                        )}
                        <div className="space-y-3">
                          <h4 className="text-white font-semibold text-sm">Scan QR Code</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Scan the QR code with your Authenticator App. If you cannot scan the code, enter this key manually:
                          </p>
                          <p className="bg-dark-900 px-3 py-2 rounded-lg font-mono text-sm text-blue-400 tracking-wider select-all border border-white/5 inline-block">
                            {secret}
                          </p>
                        </div>
                      </div>

                      <form onSubmit={confirm2FA} className="space-y-4 pt-4 border-t border-white/5">
                        <div>
                          <label className="label">Verification Code</label>
                          <div className="flex gap-3 max-w-xs">
                            <input
                              type="text"
                              className="input text-center text-lg font-bold tracking-widest"
                              placeholder="000000"
                              maxLength={6}
                              value={verifyToken}
                              onChange={e => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                              required
                            />
                            <button
                              type="submit"
                              disabled={loading2FA}
                              className="btn-primary"
                            >
                              {loading2FA ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {user.twoFactorEnabled && !disableMode && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-xs font-semibold text-white">2FA Activated</p>
                          <p className="text-[10px] text-slate-400">Your account is highly secured.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDisableMode(true)}
                        className="btn-danger py-1.5 px-3 text-xs"
                      >
                        Disable 2FA
                      </button>
                    </div>
                  )}

                  {user.twoFactorEnabled && disableMode && (
                    <form onSubmit={handleDisable2FA} className="p-5 rounded-2xl bg-white/3 border border-red-500/10 space-y-4">
                      <h4 className="text-red-400 font-bold text-sm">Confirm Disabling 2FA</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        To turn off 2FA, enter your current 6-digit authentication token. Doing this will make your account less secure.
                      </p>
                      <div>
                        <label className="label">Authenticator Code</label>
                        <div className="flex gap-3 max-w-xs">
                          <input
                            type="text"
                            className="input text-center text-lg font-bold tracking-widest border-red-500/20"
                            placeholder="000000"
                            maxLength={6}
                            value={disableToken}
                            onChange={e => setDisableToken(e.target.value.replace(/\D/g, ''))}
                            required
                          />
                          <button
                            type="submit"
                            disabled={loading2FA}
                            className="btn-danger"
                          >
                            {loading2FA ? 'Disabling...' : 'Confirm Disable'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDisableMode(false)}
                          className="text-xs text-slate-400 mt-2 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Change Password Card */}
                <div className="glass-card p-6">
                  <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                    <KeyRound className="w-5 h-5 text-purple-400" />
                    Update Password
                  </h3>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="label">Current Password</label>
                      <input
                        type="password"
                        className="input"
                        placeholder="••••••••"
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm(pf => ({ ...pf, currentPassword: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="input pr-12"
                            placeholder="••••••••"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm(pf => ({ ...pf, newPassword: e.target.value }))}
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
                      <div>
                        <label className="label">Confirm New Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="input"
                          placeholder="••••••••"
                          value={passwordForm.confirmPassword}
                          onChange={e => setPasswordForm(pf => ({ ...pf, confirmPassword: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    {/* Requirements checklist */}
                    <div className="p-4 bg-dark-950/60 rounded-2xl border border-white/5 space-y-2 text-xs">
                      <p className="font-semibold text-slate-400 mb-2">Password Requirements:</p>
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            req.satisfied
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                              : 'border-white/10 text-slate-600'
                          }`}>
                            {req.satisfied ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                          </div>
                          <span className={req.satisfied ? 'text-slate-300 font-medium' : 'text-slate-500'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading || !allPasswordReqsMet || passwordForm.newPassword !== passwordForm.confirmPassword}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
                    >
                      {passwordLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving Password...
                        </>
                      ) : (
                        'Save Password Changes'
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Active Sessions Card */}
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <h3 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/5 pb-3">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Active Sessions
                  </h3>
                  
                  {/* Current session card */}
                  <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-400">Current Session</span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-[9px] font-bold text-blue-400 rounded-full tracking-wider">ACTIVE</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">Chrome on Windows</p>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>IP: {user.lastLoginIP || '127.0.0.1'}</span>
                      <span>Refreshed just now</span>
                    </div>
                  </div>

                  {/* Mock other sessions */}
                  <div className="p-3.5 bg-white/2 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Other Device</span>
                      <span className="px-2 py-0.5 bg-slate-500/20 text-[9px] font-bold text-slate-400 rounded-full tracking-wider">IDLE</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-300">Safari on iPhone 15 Pro</p>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>IP: 192.168.1.104</span>
                      <span>Logged 2 days ago</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogoutAllDevices}
                    className="btn-danger w-full flex items-center justify-center gap-1.5 py-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout From All Devices
                  </button>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    This will invalidate all other active sessions and tokens, logging you out of mobile devices and other browsers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. PREFERENCES & PRIVACY TAB */}
          {activeTab === 'preferences' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {/* Notification preferences */}
              <div className="glass-card p-6 space-y-6">
                <h3 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/5 pb-3">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Notification Preferences
                </h3>

                <div className="space-y-4">
                  {[
                    { id: 'email', label: 'Email Notifications', desc: 'Receive project assignments and report cards via email' },
                    { id: 'whatsapp', label: 'WhatsApp Notifications', desc: 'Get instant ping notifications and status updates via WhatsApp' },
                    { id: 'system', label: 'System Notifications', desc: 'View in-app notifications and sound alerts inside dashboard' },
                    { id: 'deadlineAlerts', label: 'Deadline Alerts', desc: 'Receive reminder warnings 24 hours prior to project deadlines' }
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="pr-4">
                        <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notifSettings[item.id]}
                          onChange={(e) => {
                            setNotifSettings(prev => ({ ...prev, [item.id]: e.target.checked }));
                            toast.success(`Updated ${item.label}`);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-dark-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white peer-checked:after:border-blue-600" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy settings */}
              <div className="glass-card p-6 space-y-6">
                <h3 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/5 pb-3">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Privacy & Visibility
                </h3>

                <div className="space-y-4">
                  {[
                    { id: 'profileVisibility', label: 'Profile Visibility', desc: 'Who can view your years of experience, skills, and emergency contact' },
                    { id: 'contactVisibility', label: 'Contact Details Visibility', desc: 'Restrict who can see your mobile number and email address' },
                    { id: 'activityVisibility', label: 'Activity Feed Visibility', desc: 'Who can see your login logs and project action histories' }
                  ].map(item => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-2xl bg-white/2 border border-white/5 gap-3">
                      <div className="pr-4 max-w-sm">
                        <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                      <select
                        className="input max-w-[150px] py-2 px-3 text-xs bg-dark-950"
                        value={privacySettings[item.id]}
                        onChange={(e) => {
                          setPrivacySettings(prev => ({ ...prev, [item.id]: e.target.value }));
                          toast.success(`Updated ${item.label}`);
                        }}
                      >
                        <option value="public">Public (All)</option>
                        <option value="team">Team (Dept)</option>
                        <option value="private">Private (Only Me)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. ACTIVITY LOG TAB */}
          {activeTab === 'activity' && (
            <div className="glass-card p-6 space-y-6 animate-fade-in">
              <h3 className="text-white font-bold text-base flex items-center gap-2 border-b border-white/5 pb-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                Chronological Activity Feed
              </h3>

              {activitiesLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                </div>
              ) : activitiesList.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center py-6">No recent actions logged for this account.</p>
              ) : (
                <div className="relative pl-6 border-l border-white/10 space-y-6 ml-2 py-2">
                  {activitiesList.map((log) => (
                    <div key={log._id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-dark-900 border-2 border-cyan-500 flex items-center justify-center group-hover:scale-125 transition-transform">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </div>
                      
                      <div className="bg-white/2 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-bold text-cyan-400 rounded-full uppercase tracking-wider">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 mt-2 font-medium">
                          {log.target || 'Action performed'}
                        </p>
                        {log.ip && (
                          <p className="text-[10px] text-slate-600 mt-1.5">
                            IP Address: {log.ip} | User Agent: {log.userAgent?.split(' ')[0] || 'Unknown'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination controls */}
              {activitiesTotalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-white/5 text-xs text-slate-400">
                  <button
                    disabled={activitiesPage <= 1}
                    onClick={() => setActivitiesPage(prev => Math.max(prev - 1, 1))}
                    className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span>Page {activitiesPage} of {activitiesTotalPages}</span>
                  <button
                    disabled={activitiesPage >= activitiesTotalPages}
                    onClick={() => setActivitiesPage(prev => Math.min(prev + 1, activitiesTotalPages))}
                    className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
