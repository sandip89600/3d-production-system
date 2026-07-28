import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { profileAPI, authAPI } from '../../../api';
import Layout from '../../../components/Layout';
import {
  User, Lock, Shield, Activity, Bell, KeyRound, Upload, Trash, Plus, X,
  Briefcase, Calendar, MapPin, AlertOctagon, LogOut, Settings, Mail, Phone,
  ShieldAlert, Check, Users, Folder, LineChart, Percent, CheckCircle2, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeProfile() {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit' | 'security' | 'preferences'
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

  // Load profile data on mount
  const fetchProfileData = async () => {
    try {
      const { data } = await profileAPI.getProfile();
      setUser(data.user);
      setStatistics(data.statistics || {});
      
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
      
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load profile details.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const { data } = await profileAPI.updateProfile(profileForm);
      setUser(data.user);
      updateUser(data.user);
      toast.success('Profile details updated successfully');
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      const { data } = await profileAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success(data.message || 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setPhotoLoading(true);
    try {
      const { data } = await profileAPI.uploadPhoto(formData);
      setUser(data.user);
      updateUser(data.user);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!window.confirm('Remove profile photo?')) return;
    setPhotoLoading(true);
    try {
      const { data } = await profileAPI.removePhoto();
      setUser(data.user);
      updateUser(data.user);
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const init2FASetup = async () => {
    setLoading2FA(true);
    try {
      const { data } = await authAPI.setup2FA();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (err) {
      toast.error('Failed to initialize 2FA setup');
    } finally {
      setLoading2FA(false);
    }
  };

  const verify2FASetup = async (e) => {
    e.preventDefault();
    setLoading2FA(true);
    try {
      const { data } = await authAPI.verify2FA(verifyToken);
      setUser(data.user || { ...user, twoFactorEnabled: true });
      updateUser(data.user || { ...user, twoFactorEnabled: true });
      toast.success('Two-factor authentication enabled successfully');
      setSetupMode(false);
      setVerifyToken('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid token');
    } finally {
      setLoading2FA(false);
    }
  };

  const disable2FA = async (e) => {
    e.preventDefault();
    setLoading2FA(true);
    try {
      const { data } = await authAPI.disable2FA(disableToken);
      setUser(data.user || { ...user, twoFactorEnabled: false });
      updateUser(data.user || { ...user, twoFactorEnabled: false });
      toast.success('Two-factor authentication disabled');
      setDisableMode(false);
      setDisableToken('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid token');
    } finally {
      setLoading2FA(false);
    }
  };

  const handlePreferencesSave = async (settings) => {
    try {
      const { data } = await profileAPI.updateProfile({ notificationSettings: settings });
      setUser(data.user);
      updateUser(data.user);
      toast.success('Notification settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleToggleSetting = (key) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    handlePreferencesSave(updated);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (profileForm.skills.includes(newSkill.trim())) return;
    setProfileForm({
      ...profileForm,
      skills: [...profileForm.skills, newSkill.trim()]
    });
    setNewSkill('');
  };

  const handleRemoveSkill = (skill) => {
    setProfileForm({
      ...profileForm,
      skills: profileForm.skills.filter(s => s !== skill)
    });
  };

  if (loading) {
    return (
      <Layout title="Staff Profile" subtitle="Manage your account profile">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile" subtitle="Manage your staff profile details, preferences and security settings">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Avatar and Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 text-center relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
            
            {/* Avatar container */}
            <div className="relative group mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-emerald-500/20 bg-dark-800 flex items-center justify-center text-white text-3xl font-bold shadow-xl relative">
                {photoLoading ? (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : user.avatar || user.profilePhoto ? (
                  <img src={user.avatar || user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              
              {/* Photo Options Overlays */}
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all border border-dark-900">
                <Upload className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={photoLoading} />
              </label>
              
              {(user.avatar || user.profilePhoto) && (
                <button
                  onClick={handlePhotoRemove}
                  className="absolute top-0 right-0 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all border border-dark-900"
                  title="Remove Profile Photo"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </div>

            <h3 className="text-white font-bold text-lg leading-tight truncate w-full">{user.name}</h3>
            <p className="text-slate-400 text-xs mt-1 capitalize">{user.designation || 'Staff Member'}</p>
            <p className="text-slate-500 text-[10px] font-mono mt-0.5">{user.email}</p>

            <div className="w-full border-t border-white/5 my-4 pt-4 space-y-2.5 text-left text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Account ID</span>
                <span className="text-white font-mono">{user.employeeId || user._id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Department</span>
                <span className="text-white font-semibold">{user.department?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Status</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                  {user.accountStatus || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Interface */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'edit', label: 'Edit Profile', icon: Briefcase },
              { id: 'security', label: 'Security & 2FA', icon: Shield },
              { id: 'preferences', label: 'Preferences', icon: Bell }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSetupMode(false); setDisableMode(false); }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-6">
                <h4 className="text-white font-bold text-sm mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Full Name', value: user.name, icon: User },
                    { label: 'Email Address', value: user.email, icon: Mail },
                    { label: 'Mobile Number', value: user.mobile || 'Not set', icon: Phone },
                    { label: 'Joined On', value: user.joiningDate ? new Date(user.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A', icon: Calendar },
                    { label: 'Experience (Years)', value: `${user.experience || 0} years`, icon: Briefcase },
                    { label: 'Address', value: user.address || 'No address saved', icon: MapPin }
                  ].map((field, idx) => {
                    const Icon = field.icon;
                    return (
                      <div key={idx} className="bg-white/3 rounded-xl p-3 border border-white/5">
                        <p className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                          <Icon className="w-3 h-3 text-emerald-400" />
                          {field.label}
                        </p>
                        <p className="text-white font-medium mt-1 truncate">{field.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills section */}
              <div className="glass-card p-6">
                <h4 className="text-white font-bold text-sm mb-2">Skills & Roster Tags</h4>
                <p className="text-slate-400 text-xs mb-4">Your professional tags in the workspace</p>
                <div className="flex flex-wrap gap-2">
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">No skills listed yet</span>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="glass-card p-6">
                <h4 className="text-white font-bold text-sm mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-500 text-[10px] uppercase font-semibold">Contact Name</p>
                    <p className="text-white font-medium mt-1">{user.emergencyContact?.name || 'Not set'}</p>
                  </div>
                  <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-500 text-[10px] uppercase font-semibold">Relation</p>
                    <p className="text-white font-medium mt-1">{user.emergencyContact?.relation || 'Not set'}</p>
                  </div>
                  <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-500 text-[10px] uppercase font-semibold">Mobile Phone</p>
                    <p className="text-white font-medium mt-1">{user.emergencyContact?.mobile || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT PROFILE */}
          {activeTab === 'edit' && (
            <form onSubmit={handleProfileSave} className="glass-card p-6 space-y-4 animate-fade-in">
              <h4 className="text-white font-bold text-sm mb-2">Edit Staff Profile</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={profileForm.mobile}
                    onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Experience (Years)</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={profileForm.experience}
                    onChange={e => setProfileForm({ ...profileForm, experience: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input
                    type="text"
                    className="input"
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Skills Editor */}
              <div className="border-t border-white/5 pt-4">
                <label className="label">Skills Manager</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 3D Modeling"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <button type="button" onClick={handleAddSkill} className="btn-secondary">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 bg-white/3 rounded-xl border border-white/5">
                  {profileForm.skills.map(skill => (
                    <span key={skill} className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
                      <span>{skill}</span>
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {profileForm.skills.length === 0 && (
                    <span className="text-slate-500 text-xs">No skills listed. Type a skill and click Add.</span>
                  )}
                </div>
              </div>

              {/* Emergency Contact Editor */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <h5 className="text-white font-bold text-xs">Emergency Contact Details</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Contact Name</label>
                    <input
                      type="text"
                      className="input"
                      value={profileForm.emergencyContact.name}
                      onChange={e => setProfileForm({
                        ...profileForm,
                        emergencyContact: { ...profileForm.emergencyContact, name: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="label">Relation</label>
                    <input
                      type="text"
                      className="input"
                      value={profileForm.emergencyContact.relation}
                      onChange={e => setProfileForm({
                        ...profileForm,
                        emergencyContact: { ...profileForm.emergencyContact, relation: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="label">Mobile Number</label>
                    <input
                      type="text"
                      className="input"
                      value={profileForm.emergencyContact.mobile}
                      onChange={e => setProfileForm({
                        ...profileForm,
                        emergencyContact: { ...profileForm.emergencyContact, mobile: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                <button type="button" onClick={() => setActiveTab('overview')} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={profileSaving} className="btn-primary">
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SECURITY & 2FA */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Change Password Form */}
              <form onSubmit={handlePasswordChange} className="glass-card p-6 space-y-4">
                <h4 className="text-white font-bold text-sm">Update Password</h4>
                
                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    required
                    className="input"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">New Password</label>
                    <input
                      type="password"
                      required
                      className="input"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      className="input"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={passwordLoading} className="btn-primary">
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* Two Factor Authentication Card */}
              <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-white font-bold text-sm">Two-Factor Authentication (2FA)</h4>
                    <p className="text-slate-400 text-xs mt-1">Add an extra layer of security to your staff profile</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    user.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {!user.twoFactorEnabled ? (
                  !setupMode ? (
                    <div className="space-y-4">
                      <p className="text-slate-350 text-xs leading-relaxed">
                        Two-factor authentication secures your account by requiring an authenticator code whenever you log in. Click the setup button below to enable it.
                      </p>
                      <button onClick={init2FASetup} disabled={loading2FA} className="btn-success">
                        {loading2FA ? 'Setting up...' : 'Setup 2FA Now'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={verify2FASetup} className="space-y-4 border-t border-white/5 pt-4 animate-fade-in">
                      <h5 className="text-white font-semibold text-xs">Verify your device</h5>
                      <p className="text-slate-450 text-xs">1. Scan this QR Code using Google Authenticator or Microsoft Authenticator app:</p>
                      
                      <div className="bg-white p-3 rounded-2xl w-fit my-3 mx-auto md:mx-0">
                        <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
                      </div>

                      <p className="text-slate-450 text-xs">2. If you cannot scan QR, enter the text key secret: <strong className="text-white font-mono text-[13px]">{secret}</strong></p>
                      
                      <div>
                        <label className="label">3. Enter the 6-digit Authenticator Token</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="000000"
                            className="input w-36 text-center tracking-widest text-lg font-mono"
                            value={verifyToken}
                            onChange={e => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                          />
                          <button type="submit" disabled={loading2FA} className="btn-primary">
                            Verify & Enable
                          </button>
                        </div>
                      </div>
                    </form>
                  )
                ) : (
                  !disableMode ? (
                    <div className="space-y-4">
                      <p className="text-slate-350 text-xs leading-relaxed">
                        Your account is currently protected with Two-Factor Authentication. If you wish to disable this feature, click the disable button below.
                      </p>
                      <button onClick={() => setDisableMode(true)} className="btn-danger">
                        Disable 2FA
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={disable2FA} className="space-y-4 border-t border-white/5 pt-4 animate-fade-in">
                      <h5 className="text-white font-semibold text-xs text-red-400">Disable Two-Factor Authentication</h5>
                      <p className="text-slate-450 text-xs">To verify your identity, enter the current 6-digit token from your authenticator app:</p>
                      
                      <div>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="000000"
                            className="input w-36 text-center tracking-widest text-lg font-mono"
                            value={disableToken}
                            onChange={e => setDisableToken(e.target.value.replace(/\D/g, ''))}
                          />
                          <button type="submit" disabled={loading2FA} className="btn-danger">
                            Confirm Disable
                          </button>
                        </div>
                      </div>
                    </form>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="glass-card p-6 space-y-6 animate-fade-in">
              <div>
                <h4 className="text-white font-bold text-sm">Notification Settings</h4>
                <p className="text-slate-400 text-xs mt-1">Configure your alert channels for project allocations and review updates</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'email', title: 'Email Alerts', desc: 'Receive welcome, updates and assignment summaries directly to your inbox.' },
                  { key: 'whatsapp', title: 'WhatsApp Messages', desc: 'Get quick instant alerts on project handovers and deadlines.' },
                  { key: 'system', title: 'System Notifications', desc: 'Receive in-app bells and updates in your browser workspace dashboard.' },
                  { key: 'deadlineAlerts', title: 'Deadline Reminders', desc: 'Warns you of upcoming project submission target deadlines.' }
                ].map(setting => (
                  <div key={setting.key} className="flex justify-between items-start gap-4 p-4 rounded-2xl bg-white/3 border border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-white font-semibold text-sm">{setting.title}</p>
                      <p className="text-slate-450 text-xs leading-relaxed max-w-lg">{setting.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifSettings[setting.key]}
                        onChange={() => handleToggleSetting(setting.key)}
                      />
                      <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-350 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
