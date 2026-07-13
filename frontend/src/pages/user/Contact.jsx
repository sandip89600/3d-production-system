import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles, Building, Layers, ShieldAlert } from 'lucide-react';
import Card3DTilt from '../../components/public/Card3DTilt';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', projectType: 'Architecture Visualization', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm({ name: '', email: '', projectType: 'Architecture Visualization', message: '' });
    }, 1500);
  };

  const projectOptions = [
    'Architecture Visualization',
    'Interior Visualization',
    'Exterior Rendering',
    'Walkthrough Animation',
    'Product Rendering & Modeling',
    'Other'
  ];

  return (
    <div className="pt-28 pb-24 overflow-hidden">
      
      <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-16">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-amber-500 tracking-widest bg-amber-500/10 px-3 py-1 rounded-full w-fit mx-auto border border-amber-500/20">
            Get In Touch
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Let's Discuss Your Project</h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Ready to convert blueprints into photorealistic rendering assets? Send us your project details, and our architectural cg-directors will follow up.
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Glassmorphic Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card3DTilt intensity={4} className="rounded-3xl h-full shadow-2xl">
            <div className="bg-[#0b101c]/80 backdrop-blur-md border border-slate-800 p-8 md:p-12 rounded-3xl h-full relative overflow-hidden">
              
              {/* Form header */}
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-850/60">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Project Brief Form</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Responds within 24 hours</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!success ? (
                  <motion.form
                    key="contact-form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-400">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sarah Connor"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      
                      {/* Email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-400">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. sarah@developer.com"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Project type */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Visualization Need *</label>
                      <select
                        value={form.projectType}
                        onChange={e => setForm({ ...form, projectType: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                      >
                        {projectOptions.map(opt => (
                          <option key={opt} value={opt} className="bg-slate-950 text-slate-200">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Describe Your Project *</label>
                      <textarea
                        required
                        rows={5}
                        placeholder="e.g. We have CAD files and SketchUp models for a 12-story residential condo. We require 6 exterior renders and 1 walkthrough animation."
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Processing Details...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Project Request</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-12 gap-5"
                  >
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/30">
                      <CheckCircle2 className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Project Request Sent!</h4>
                      <p className="text-slate-400 text-sm max-w-sm mt-2 leading-relaxed">
                        Thank you for contacting us. A CG director from All 3D Studio Noida has received your details and will schedule a call.
                      </p>
                    </div>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-xs text-amber-500 border border-amber-550/20 bg-amber-500/5 px-4.5 py-2.5 rounded-xl hover:bg-amber-500/10 transition-all font-semibold mt-2 cursor-pointer"
                    >
                      Send Another Request
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </Card3DTilt>
        </div>

        {/* Right Column: Contact info & Maps (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
          
          {/* Info Details Cards */}
          <div className="flex flex-col gap-5">
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Corporate Office</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  102, Design District, Sector 62, Noida, Uttar Pradesh, 201301, India
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Call Us</h4>
                <p className="text-xs text-slate-400">+91 98765 43210</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Mon - Fri: 9:00 AM - 6:00 PM IST</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Email</h4>
                <p className="text-xs text-slate-400">hello@all3dstudio.com</p>
                <p className="text-xs text-slate-400">quotes@all3dstudio.com</p>
              </div>
            </div>
          </div>

          {/* Map Embed (Interactive Custom Mock Iframe) */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#070c17] aspect-[4/3] w-full flex items-center justify-center group shadow-xl">
            {/* Map lines background representation */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent pointer-events-none" />
            
            {/* Dark Styled Map Iframe */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.5620138981504!2d77.36214587630325!3d28.612891975674066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce545a90d8a59%3A0x2a1a8c9b32c6686e!2sSector%2062%2C%20Noida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
              title="Google Map Noida Sector 62"
              className="w-full h-full border-none opacity-50 group-hover:opacity-75 transition-opacity duration-500"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
            />
            
            {/* Overlay Glass Card showing location tag */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-2xl flex items-center gap-3 pointer-events-none transition-transform group-hover:translate-y-[-2px] duration-300">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">A</div>
              <div>
                <p className="text-[10px] text-white font-bold">All 3D Studio Headquarters</p>
                <p className="text-[8px] text-slate-400">Sector 62, Noida, UP, India</p>
              </div>
            </div>
          </div>

        </div>

      </section>

    </div>
  );
}
