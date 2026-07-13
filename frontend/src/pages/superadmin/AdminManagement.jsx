import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, departmentsAPI } from '../../api';
import Layout from '../../components/Layout';
import { ProgressBar } from '../../components/Badges';
import { Plus, X, Search, Power, User, Mail, Hash, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminManagement() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [activeRole, setActiveRole] = useState('admin');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', adminCode: '', department: '' });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', activeRole],
    queryFn: () => usersAPI.getAll({ role: activeRole, limit: 100 }).then(r => r.data),
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data),
  });

  const { data: perfData } = useQuery({
    queryKey: ['performance', activeRole],
    queryFn: () => {
      if (activeRole === 'admin') {
        return import('../../api').then(m => m.analyticsAPI.getAdminPerformance()).then(r => r.data);
      } else {
        return import('../../api').then(m => m.analyticsAPI.getEmployeePerformance()).then(r => r.data);
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => usersAPI.create({ ...data, role: activeRole }),
    onSuccess: () => {
      toast.success(`${activeRole === 'admin' ? 'Admin' : 'Employee'} created successfully`);
      qc.invalidateQueries(['users', activeRole]);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', adminCode: '', department: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error creating user'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => usersAPI.update(id, { isActive }),
    onSuccess: () => {
      toast.success('User status updated');
      qc.invalidateQueries(['users', activeRole]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: (data) => {
      toast.success(data.message || 'User deleted successfully');
      qc.invalidateQueries(['users', activeRole]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user'),
  });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', adminCode: '', department: '' });

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      adminCode: user.adminCode || '',
      department: user.department?._id || user.department || '',
    });
  };

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => {
      toast.success(`${activeRole === 'admin' ? 'Admin' : 'Employee'} details updated successfully`);
      qc.invalidateQueries(['users', activeRole]);
      setEditingUser(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error updating user'),
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editMutation.mutate({ id: editingUser._id, data: editForm });
  };

  const users = usersData?.users || [];
  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.adminCode || '').toLowerCase().includes(search.toLowerCase())
  );

  const getPerfStats = (userId) => {
    if (activeRole === 'admin') {
      return perfData?.adminStats?.find(s => s._id === userId) || {};
    } else {
      const stats = perfData?.employeeStats?.find(s => s._id === userId) || {};
      return {
        totalUploaded: stats.totalAssigned || 0,
        completed: stats.completed || 0,
        active: stats.active || 0,
        completionRate: stats.completionRate || 0
      };
    }
  };

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone and will unassign any active projects.`)) {
      deleteMutation.mutate(user._id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <Layout title="User Management" subtitle={`Manage All3DStudio ${activeRole} accounts and performance`}>
      {/* Role Selection Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => { setActiveRole('admin'); setSearch(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeRole === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Admins
          </button>
          <button
            onClick={() => { setActiveRole('employee'); setSearch(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeRole === 'employee' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Employees
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-10 w-64"
              placeholder={`Search ${activeRole}s...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add {activeRole === 'admin' ? 'Admin' : 'Employee'}
          </button>
        </div>
      </div>

      {/* User Cards Grid */}
      {usersLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(user => {
            const perf = getPerfStats(user._id);
            return (
              <div key={user._id} className={`glass-card p-6 flex flex-col transition-all duration-300 ${!user.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user.adminCode || user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{user.name}</h3>
                      <p className="text-slate-400 text-xs truncate max-w-[180px]">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(user)}
                      className="w-8 h-8 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all"
                      title="Edit User Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate({ id: user._id, isActive: !user.isActive })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${user.isActive ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all"
                      title="Permanently Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {user.adminCode && (
                    <span className="badge bg-blue-500/20 text-blue-400">
                      <Hash className="w-3 h-3" />{user.adminCode}
                    </span>
                  )}
                  <span className={`badge text-xs ${user.isActive ? 'badge-available' : 'badge-delayed'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {user.department && (
                    <span className="badge bg-purple-500/20 text-purple-400 text-xs">
                      {user.department?.name || 'No Dept'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 mt-auto">
                  {[
                    { label: activeRole === 'admin' ? 'Uploaded' : 'Assigned', value: perf.totalUploaded || 0 },
                    { label: 'Completed', value: perf.completed || 0 },
                    { label: 'Active', value: perf.active || 0 },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-xl p-2 text-center">
                      <p className="text-white font-bold text-lg leading-none mb-1">{s.value}</p>
                      <p className="text-slate-500 text-[10px] uppercase font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-xs">Completion Rate</span>
                    <span className="text-white text-xs font-semibold">{Math.round(perf.completionRate || 0)}%</span>
                  </div>
                  <ProgressBar progress={Math.round(perf.completionRate || 0)} showLabel={false} />
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-3 glass-card p-12 text-center text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No {activeRole}s found</p>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-dark-900 border border-white/10 rounded-2xl p-6 w-full max-w-md animate-slide-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Create New {activeRole === 'admin' ? 'Admin' : 'Employee'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder={activeRole === 'admin' ? "e.g. Lekhraj Pandit" : "e.g. Aakash Sharma"} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className={activeRole === 'admin' ? "" : "col-span-2"}>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="user@all3dstudio.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                {activeRole === 'admin' && (
                  <div>
                    <label className="label">Admin Code</label>
                    <input className="input uppercase" placeholder="LAB" maxLength={5} value={form.adminCode} onChange={e => setForm(f => ({ ...f, adminCode: e.target.value.toUpperCase() }))} required />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>

              <div>
                <label className="label">Department {activeRole === 'employee' ? '(required)' : '(optional)'}</label>
                <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required={activeRole === 'employee'}>
                  <option value="">Select department</option>
                  {(deptData?.departments || []).map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating...' : `Create ${activeRole === 'admin' ? 'Admin' : 'Employee'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-dark-900 border border-white/10 rounded-2xl p-6 w-full max-w-md animate-slide-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Edit {activeRole === 'admin' ? 'Admin' : 'Employee'}</h2>
              <button onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="Full Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className={activeRole === 'admin' ? "" : "col-span-2"}>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="user@all3dstudio.com" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                {activeRole === 'admin' && (
                  <div>
                    <label className="label">Admin Code</label>
                    <input className="input uppercase" placeholder="LAB" maxLength={5} value={editForm.adminCode} onChange={e => setEditForm(f => ({ ...f, adminCode: e.target.value.toUpperCase() }))} required />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Department {activeRole === 'employee' ? '(required)' : '(optional)'}</label>
                <select className="input" value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} required={activeRole === 'employee'}>
                  <option value="">Select department</option>
                  {(deptData?.departments || []).map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={editMutation.isPending} className="btn-primary flex-1">
                  {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
