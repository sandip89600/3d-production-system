import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../../../api';
import Layout from '../../../components/Layout';
import { Plus, X, Search, Power, User, Mail, Hash, Briefcase, Trash2, Edit2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', mobile: '' });

  // 1. Fetch Clients
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'client'],
    queryFn: () => usersAPI.getAll({ role: 'client', limit: 100 }).then(r => r.data),
  });

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (data) => usersAPI.create({ ...data, role: 'client' }),
    onSuccess: () => {
      toast.success('Client account created successfully');
      qc.invalidateQueries(['users', 'client']);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', companyName: '', mobile: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error creating client'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => usersAPI.update(id, { isActive }),
    onSuccess: () => {
      toast.success('Client status updated');
      qc.invalidateQueries(['users', 'client']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update client status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: (data) => {
      toast.success(data.message || 'Client account deleted successfully');
      qc.invalidateQueries(['users', 'client']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete client'),
  });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', companyName: '', mobile: '' });

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      companyName: user.companyName || '',
      mobile: user.mobile || '',
    });
  };

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => {
      toast.success('Client workspace details updated successfully');
      qc.invalidateQueries(['users', 'client']);
      setEditingUser(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error updating client details'),
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editMutation.mutate({ id: editingUser._id, data: editForm });
  };

  const users = usersData?.users || [];
  const filtered = users.filter(u =>
    !search || 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.companyName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to permanently delete client ${user.name}? This will remove their project references and active workspaces.`)) {
      deleteMutation.mutate(user._id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <Layout title="Client Workspace Management" subtitle="Manage visualization client accounts and their organizations">
      
      {/* Search and Create Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-10 w-64 text-sm"
            placeholder="Search clients / organizations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-1.5 self-start sm:self-auto text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Grid of Client Cards */}
      {usersLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(user => (
            <div key={user._id} className="glass-card p-6 flex flex-col justify-between border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group">
              
              {/* Top Details */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm leading-snug group-hover:text-cyan-400 transition-colors">{user.name}</h4>
                      <p className="text-slate-400 text-xs mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${user.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>

                {/* Organization and phone details */}
                <div className="space-y-2.5 my-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>Company: <strong className="text-white font-medium">{user.companyName || '—'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mobile: <strong className="text-white font-medium">{user.mobile || '—'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                    <span>Total Projects: <strong className="text-white font-medium">{user.totalProjects || 0}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 gap-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-semibold py-1.5 px-3 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ id: user._id, isActive: !user.isActive })}
                    className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${user.isActive ? 'text-rose-400 hover:bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'}`}
                    title={user.isActive ? 'Suspend client account' : 'Reactivate client account'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="p-2 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/30 transition-colors"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white/3 border border-dashed border-white/10 rounded-2xl">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No client users matched search query</p>
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-1.5">
              <span>Add Client Account</span>
            </h3>
            <p className="text-slate-400 text-xs mb-6">Create client portal logins and company mappings</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Company / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="Miller Architecture Inc"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@miller.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Account Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all mt-6 text-sm"
              >
                {createMutation.isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Editing Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-455 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-bold text-lg mb-1">
              Edit Client Details
            </h3>
            <p className="text-slate-400 text-xs mb-6">Modify workspace details for {editingUser.name}</p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Company / Organization</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={editForm.companyName}
                  onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={editForm.mobile}
                  onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={editMutation.isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all mt-6 text-sm"
              >
                {editMutation.isLoading ? 'Saving updates...' : 'Save Client Updates'}
              </button>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}
