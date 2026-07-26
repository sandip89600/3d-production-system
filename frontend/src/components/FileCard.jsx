import React, { useState } from 'react';
import { 
  FileImage, FileArchive, FileText, Download, Eye, 
  FileCode, Boxes, X, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/client';

const getFileIconInfo = (ext) => {
  const cleanExt = ext ? ext.toLowerCase().replace('.', '') : '';
  
  if (['jpg', 'jpeg', 'png', 'webp'].includes(cleanExt)) {
    return {
      icon: FileImage,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      label: 'Image',
      isImage: true
    };
  }
  
  if (['dwg', 'dxf', 'skp', 'dae'].includes(cleanExt)) {
    return {
      icon: FileCode,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      label: 'CAD / CAD Model',
      isImage: false
    };
  }
  
  if (['3ds', 'max'].includes(cleanExt)) {
    return {
      icon: Boxes,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      label: '3D Studio Max',
      isImage: false
    };
  }
  
  if (cleanExt === 'psd') {
    return {
      icon: FileImage,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      label: 'Adobe Photoshop',
      isImage: false
    };
  }
  
  if (cleanExt === 'cdr') {
    return {
      icon: FileImage,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      label: 'CorelDRAW',
      isImage: false
    };
  }
  
  if (cleanExt === 'zip') {
    return {
      icon: FileArchive,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      label: 'ZIP Archive',
      isImage: false
    };
  }
  
  return {
    icon: FileText,
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    label: 'Document',
    isImage: false
  };
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileCard({ file }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showNoPreview, setShowNoPreview] = useState(false);
  
  if (!file) return null;

  const fileId = file._id || file.fileId || file.id;
  const fileName = file.originalName || file.fileName || 'file';
  const extension = file.originalExtension || file.extension || file.fileType || '';
  const fileSize = file.originalSize || file.fileSize || 0;
  const compressedSize = file.compressedSize || null;
  const compressionStatus = file.compressionStatus || 'none';
  const compressedName = file.compressedName || null;
  const uploadDate = file.uploadDate || file.createdAt || new Date();

  const iconInfo = getFileIconInfo(extension);
  const Icon = iconInfo.icon;

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!fileId) {
      toast.error('File identifier missing.');
      return;
    }
    const toastId = toast.loading(`Starting download of ${fileName}...`);
    try {
      const response = await api.get(`/upload/${fileId}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dlName = compressionStatus === 'compressed' ? compressedName : fileName;
      link.setAttribute('download', dlName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded successfully! 🎉', { id: toastId });
    } catch (err) {
      console.error('[FileCard] Download error:', err);
      toast.error(err.response?.data?.message || 'Direct download failed.', { id: toastId });
    }
  };

  const handleView = (e) => {
    e.preventDefault();
    if (iconInfo.isImage && file.fileUrl) {
      setShowPreview(true);
    } else {
      setShowNoPreview(true);
    }
  };

  // Build clean display name for path
  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${path}`;
  };

  return (
    <>
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition-all duration-300">
        
        {/* Left Side: Icon & Details */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${iconInfo.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className="text-white text-sm font-semibold truncate" title={fileName}>
              {fileName}
            </h4>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-slate-500">
              <span className="font-mono uppercase text-blue-400 font-bold">{extension.replace('.', '')}</span>
              <span>•</span>
              <span>{formatSize(fileSize)}</span>
              {compressionStatus === 'compressed' && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold">
                    ZIP ({formatSize(compressedSize)})
                  </span>
                </>
              )}
              <span>•</span>
              <span>{format(new Date(uploadDate), 'dd MMM yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start shrink-0">
          <button
            onClick={handleView}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-700/50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>

      </div>

      {/* Image Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card max-w-4xl w-full p-4 flex flex-col items-center relative max-h-[90vh] animate-scale-in">
            <button 
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all p-2 rounded-full border border-white/10 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-bold text-sm mb-3 truncate w-[80%] text-center">{fileName}</h3>
            
            <div className="flex-1 overflow-hidden flex items-center justify-center rounded-lg bg-black/40 border border-white/5 w-full p-2">
              <img 
                src={getFileUrl(file.fileUrl)} 
                alt={fileName} 
                className="max-h-[70vh] max-w-full object-contain rounded-md"
              />
            </div>
            
            <div className="mt-4 flex gap-2 w-full justify-end">
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Original</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Not Available Modal */}
      {showNoPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 text-center relative animate-scale-in">
            <button 
              onClick={() => setShowNoPreview(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h3 className="text-white font-bold text-lg mb-2">Preview Not Available</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Browser preview is only supported for image formats. To use or inspect this file, please download it directly to your system.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNoPreview(false)}
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Close
              </button>
              
              <button
                onClick={handleDownload}
                className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
