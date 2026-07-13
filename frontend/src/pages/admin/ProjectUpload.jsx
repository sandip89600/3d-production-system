import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsAPI, departmentsAPI } from '../../api';
import Layout from '../../components/Layout';
import { Upload, X, File, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PROJECT_TYPES = ['3D architecture', 'Modeling', 'rendering', 'VFX', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const ALLOWED_EXTS = ['.zip', '.rar', '.blend', '.max', '.fbx', '.jpg', '.jpeg', '.png', '.pdf', '.mp4'];

export default function ProjectUpload() {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    name: '', type: 'Modeling', department: '',
    description: '', priority: 'medium',
    deadline: '', estimatedDays: '', clientName: '', tags: '',
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData) => projectsAPI.create(formData),
    onSuccess: (res) => {
      toast.success('Project uploaded successfully! 🎉');
      setResult(res.data);
      qc.invalidateQueries(['admin-dashboard']);
      qc.invalidateQueries(['projects']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const handleFile = (f) => {
    if (!f) return;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      toast.error(`File type ${ext} not allowed`);
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.department) { toast.error('Please select a department'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (file) fd.append('file', file);
    uploadMutation.mutate(fd);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (result) {
    return (
      <Layout title="Upload Project" subtitle="New project successfully uploaded">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-white font-bold text-2xl mb-2">Project Uploaded! 🎉</h2>
            <p className="text-slate-400 mb-6">"{result.project?.name}" is now live in the system.</p>

            {result.whatsappNotified && result.whatsappMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-sm">WhatsApp Notification Sent</span>
                </div>
                <pre className="text-slate-300 text-xs font-mono whitespace-pre-wrap leading-relaxed bg-black/20 rounded-xl p-3">
                  {result.whatsappMessage}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Department', value: result.project?.department?.name },
                { label: 'Priority', value: result.project?.priority?.toUpperCase() },
                { label: 'Deadline', value: result.project?.deadline ? new Date(result.project.deadline).toLocaleDateString() : '—' },
                { label: 'Status', value: 'Available' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-slate-400 text-xs">{s.label}</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setResult(null)} className="btn-secondary flex-1">Upload Another</button>
              <button onClick={() => { setResult(null); window.location.href = '/admin/projects'; }} className="btn-primary flex-1">View Projects</button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Upload Project" subtitle="Create and distribute a new project to your team">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Project Name *</label>
                <input className="input" placeholder="e.g. Car Exterior Model" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Project Type *</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Department *</label>
                <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required>
                  <option value="">Select department</option>
                  {(deptData?.departments || []).map(d => (
                    <option key={d._id} value={d._id}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deadline *</label>
                <input type="date" className="input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="label">Client Name</label>
                <input className="input" placeholder="e.g. AutoViz Ltd" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Estimated Days</label>
                <input type="number" className="input" placeholder="e.g. 7" min={1} value={form.estimatedDays} onChange={e => setForm(f => ({ ...f, estimatedDays: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} placeholder="Describe the project requirements..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Tags (comma separated)</label>
                <input className="input" placeholder="exterior, luxury, photorealistic" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-1">Project File</h3>
            <p className="text-slate-400 text-xs mb-4">Supported: .zip .rar .blend .max .fbx .jpg .png .pdf (max 100MB)</p>

            {!file ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/3'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-3 ${dragOver ? 'text-blue-400' : 'text-slate-500'}`} />
                <p className="text-white font-medium mb-1">Drop file here or click to browse</p>
                <p className="text-slate-400 text-sm">File upload is optional</p>
                <input ref={fileRef} type="file" accept={ALLOWED_EXTS.join(',')} className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <File className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-slate-400 text-xs">{formatFileSize(file.size)}</p>
                </div>
                <button type="button" onClick={() => setFile(null)} className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* WhatsApp notice */}
          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <MessageSquare className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-400 font-medium text-sm">WhatsApp Auto-Notification</p>
              <p className="text-slate-400 text-xs mt-0.5">After upload, a notification will be automatically sent to the department's WhatsApp group with project details and a link to the dashboard.</p>
            </div>
          </div>

          <button type="submit" disabled={uploadMutation.isPending} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base">
            {uploadMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading & Notifying...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Project
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
