import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsAPI, usersAPI } from '../../../api';
import Layout from '../../../components/Layout';
import { Plus, X, Building2, Users, MessageSquare, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEPT_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
const DEPT_ICONS = ['🧊', '🎨', '🎬', '🖌️', '💡', '⚡', '🌟'];

export default function DepartmentManagement() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', admin: '', whatsappGroupId: '', whatsappGroupName: '', color: '#3B82F6', icon: '🎨' });

  const { data: deptData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data),
  });

  const { data: adminData } = useQuery({
    queryKey: ['admins'],
    queryFn: () => usersAPI.getAdmins().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => departmentsAPI.create(d),
    onSuccess: () => {
      toast.success('Department created!');
      qc.invalidateQueries(['departments']);
      setShowModal(false);
      setForm({ name: '', code: '', description: '', admin: '', whatsappGroupId: '', whatsappGroupName: '', color: '#3B82F6', icon: '🎨' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const depts = deptData?.departments || [];

  return (
    <Layout title="Department Management" subtitle="Manage departments, admins, and WhatsApp groups">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">{depts.length} departments active</p>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {depts.map(dept => (
          <div key={dept._id} className="glass-card p-6 hover:bg-white/8 transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                  style={{ background: `${dept.color}25`, border: `1px solid ${dept.color}40` }}
                >
                  {dept.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold">{dept.name}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md text-slate-300" style={{ background: `${dept.color}20` }}>
                    {dept.code}
                  </span>
                </div>
              </div>
            </div>

            {dept.description && (
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{dept.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-400 text-xs">Employees</span>
                </div>
                <p className="text-white font-bold text-xl">{dept.employees?.length || 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-400 text-xs">WhatsApp</span>
                </div>
                <p className={`font-semibold text-sm ${dept.whatsappGroupId ? 'text-emerald-400' : 'text-red-400'}`}>
                  {dept.whatsappGroupId ? 'Linked' : 'Not Set'}
                </p>
              </div>
            </div>

            {/* Admin */}
            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {dept.admin?.adminCode?.charAt(0) || dept.admin?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-white text-xs font-medium">{dept.admin?.name || 'No admin assigned'}</p>
                {dept.admin?.adminCode && <p className="text-slate-500 text-xs">[{dept.admin.adminCode}]</p>}
              </div>
            </div>

            {/* WhatsApp group name */}
            {dept.whatsappGroupName && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <MessageSquare className="w-3 h-3" />
                <span>{dept.whatsappGroupName}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-dark-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg animate-slide-in-up my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Create Department</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Department Name</label>
                  <input className="input" placeholder="e.g. 3D architecture" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Code</label>
                  <input className="input uppercase" placeholder="MDL" maxLength={5} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} placeholder="Department description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Department Admin</label>
                <select className="input" value={form.admin} onChange={e => setForm(f => ({ ...f, admin: e.target.value }))}>
                  <option value="">Select admin</option>
                  {(adminData?.admins || []).map(a => (
                    <option key={a._id} value={a._id}>[{a.adminCode}] {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">WhatsApp Group Name</label>
                  <input className="input" placeholder="Modeling Team" value={form.whatsappGroupName} onChange={e => setForm(f => ({ ...f, whatsappGroupName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">WhatsApp Group ID</label>
                  <input className="input" placeholder="120363xxx@g.us" value={form.whatsappGroupId} onChange={e => setForm(f => ({ ...f, whatsappGroupId: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                    <div className="flex gap-1 flex-wrap">
                      {DEPT_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-900' : ''}`} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {DEPT_ICONS.map(icon => (
                      <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))} className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all hover:bg-white/10 ${form.icon === icon ? 'bg-white/15 ring-1 ring-white/30' : 'bg-white/5'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
