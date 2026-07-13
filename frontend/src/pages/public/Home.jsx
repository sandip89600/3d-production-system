import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Eye, ShieldCheck, ArrowRight, Play, Sparkles, Building, Layers, Film, Box, Sofa, Milestone } from 'lucide-react';
import Card3DTilt from '../../components/public/Card3DTilt';
import FloatingRenders from '../../components/public/FloatingRenders';
import BeforeAfterSlider from '../../components/public/BeforeAfterSlider';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videoFailed, setVideoFailed] = useState(false);

  const services = [
    { title: '3D Architecture Visualization', icon: Building, desc: 'Photorealistic exterior renderings that bring blueprint blueprints to life.' },
    { title: 'Interior Visualization', icon: Sofa, desc: 'Luxury lighting, realistic material finishes, and cozy indoor settings.' },
    { title: 'Exterior Rendering', icon: Compass, desc: 'Cinematic environments, detailed landscaping, and natural weather effects.' },
    { title: 'Walkthrough Animation', icon: Film, desc: 'Cinematic camera tracks and drone flythroughs showcasing complete space layouts.' },
    { title: 'Product Rendering', icon: Box, desc: 'Studio lighting setups and hyper-detailed product visualizations.' },
    { title: '3D Modeling', icon: Layers, desc: 'Precise CAD-to-mesh translations and clean architectural topologies.' },
    { title: 'Furniture Rendering', icon: Sofa, desc: 'Detailed textures, custom fabrics, and realistic leather modeling.' },
    { title: 'Architectural Animation', icon: Sparkles, desc: 'Full narrative animations combining exterior drone shots with indoor sweeps.' }
  ];

  const portfolioCategories = ['All', 'Architecture', 'Interior', 'Exterior', 'Animation'];

  const projects = [
    {
      id: 1,
      title: 'Marina Sands Villa',
      category: 'Exterior',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      location: 'Miami, FL',
    },
    {
      id: 2,
      title: 'Nordic Minimalist Kitchen',
      category: 'Interior',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      location: 'Oslo, Norway',
    },
    {
      id: 3,
      title: 'Skylight Business Tower',
      category: 'Architecture',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      location: 'Tokyo, Japan',
    },
    {
      id: 4,
      title: 'Golden Hour Glasshouse',
      category: 'Exterior',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      location: 'Zurich, Switzerland',
    },
    {
      id: 5,
      title: 'Amber Resonance Atrium',
      category: 'Interior',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      location: 'London, UK',
    },
    {
      id: 6,
      title: 'Villas on the Water',
      category: 'Animation',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      location: 'Dubai, UAE',
    }
  ];

  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter(p => p.category === selectedCategory || (selectedCategory === 'Architecture' && (p.category === 'Exterior' || p.category === 'Interior')));

  return (
    <div className="overflow-hidden">
      
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 lg:px-12">
        {/* Walkthrough Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {!videoFailed ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoFailed(true)}
              className="w-full h-full object-cover scale-105"
              style={{ filter: 'brightness(0.25) contrast(1.1)' }}
            >
              <source
                src="https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414dca25e24391e6b83f36035f606&profile_id=139&oauth2_token_id=57447761"
                type="video/mp4"
              />
              <source
                src="https://assets.mixkit.co/videos/preview/mixkit-luxury-home-entrance-with-swimming-pool-42514-large.mp4"
                type="video/mp4"
              />
            </video>
          ) : (
            <div
              className="w-full h-full bg-cover bg-center animate-pan"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80")',
                filter: 'brightness(0.25) contrast(1.1)'
              }}
            />
          )}
          {/* Glowing Gradients Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-[#020617]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-[#020617]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-400 w-fit">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>World-Class 3D Visualization Studio</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              We Render <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                Future Architecture
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
              Transforming wireframes and blueprint schematics into breathtaking, photorealistic cinematic experiences. We work with leading developers and architects worldwide.
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <Link
                to="/portfolio"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 group transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-95"
              >
                <span>Explore Portfolio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 font-semibold px-6 py-3.5 rounded-xl transition-all hover:border-slate-700 active:scale-95"
              >
                Request a Quote
              </Link>
            </div>

            {/* Quick Stats Panel (Floating Glass Panel) */}
            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-850/60 mt-4 max-w-md">
              <div>
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Renders Delivered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">99.2%</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Accuracy Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">15+</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Global Awards</p>
              </div>
            </div>

          </motion.div>

          {/* Floating Parallax Renders Column */}
          <div className="hidden lg:block">
            <FloatingRenders />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-[10px] uppercase tracking-widest text-slate-450 font-bold">Scroll Down</span>
          <div className="w-5 h-8.5 rounded-full border border-slate-700 p-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce mx-auto" />
          </div>
        </div>
      </section>

      {/* 2. ABOUT PREVIEW SECTION */}
      <section className="py-24 px-6 lg:px-12 bg-[#020617] border-y border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="relative">
            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80"
              afterImage="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
              beforeLabel="Wireframe Mesh"
              afterLabel="Final Render"
              className="shadow-2xl shadow-slate-950"
            />
            <div className="absolute -bottom-6 -right-6 rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Milestone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Drag to Compare</p>
                <p className="text-xs text-white font-semibold">100% CAD Scale Accuracy</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <p className="text-xs uppercase font-bold text-amber-500 tracking-widest">Mastering the Details</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Catering to Luxury Real Estate and High-End Architecture.
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              All 3D Studio was founded on a simple principle: details build trust. From the specular roughness of marble flooring to the ambient sunset hues reflecting on insulated glazing, we leave nothing to chance. We combine artistic sensibilities with state-of-the-art computational rendering tools.
            </p>
            <p className="text-slate-400 leading-relaxed text-sm">
              Our visualizers, texture artists, and camera operators collaborate with interior designers and project managers to yield assets that generate pre-sales, command design approvals, and win bids.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-amber-500 font-semibold hover:text-amber-400 transition-colors w-fit mt-2 group text-sm"
            >
              <span>Read Our Full Story</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* 3. SERVICES SECTION */}
      <section className="py-24 px-6 lg:px-12 bg-[#060b16]/40 relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">
            <p className="text-xs uppercase font-bold text-amber-500 tracking-widest">Our Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Photorealistic Visualization Services
            </h2>
            <p className="text-slate-400 text-sm">
              Delivering specialized, high-definition assets for architects, developers, furniture makers, and design boutiques.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, idx) => (
              <Card3DTilt key={idx} intensity={10} className="rounded-2xl h-full">
                <div className="bg-[#0b101c]/90 border border-slate-800/80 p-6 rounded-2xl h-full flex flex-col gap-5 hover:border-slate-700/60 transition-colors shadow-lg">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide mb-2">{s.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Card3DTilt>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PORTFOLIO MASONRY SECTION */}
      <section className="py-24 px-6 lg:px-12 bg-[#020617]">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <p className="text-xs uppercase font-bold text-amber-500 tracking-widest">Featured Work</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">
                Cinematic Portfolio
              </h2>
            </div>
            
            {/* Categories filter */}
            <div className="flex flex-wrap gap-2">
              {portfolioCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Project masonry cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map(proj => (
              <Card3DTilt key={proj.id} intensity={12} className="rounded-2xl overflow-hidden group">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col justify-end p-6">
                  {/* Image with zoom on card hover */}
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.7] group-hover:brightness-[0.8]"
                  />
                  
                  {/* Spotlight shadow overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 z-0" />

                  {/* Project Info */}
                  <div className="relative z-10 flex flex-col gap-1.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {proj.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{proj.location}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight">{proj.title}</h4>
                    <Link
                      to={`/portfolio?id=${proj.id}`}
                      className="text-xs text-white opacity-0 group-hover:opacity-100 flex items-center gap-1 hover:text-amber-500 transition-all font-semibold mt-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </Card3DTilt>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:border-slate-700 active:scale-95"
            >
              <span>View All Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE NEWSLETTER / CTA */}
      <section className="py-24 px-6 lg:px-12 bg-gradient-to-b from-[#020617] to-[#0a0f1e] relative overflow-hidden border-t border-slate-900">
        
        {/* Glow orbs */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-amber-500/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-12 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[90px] pointer-events-none" />

        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#0c1224] to-[#121a30] border border-slate-800/80 rounded-3xl p-8 md:p-16 text-center relative z-10 shadow-2xl">
          <div className="flex flex-col gap-6 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <Eye className="w-6 h-6" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Ready to Visualize Your Next Landmark?
            </h2>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Contact us today for a free review of your 3D assets or architectural drawings. We provide quick quotes and detailed project turnaround estimates.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/10 active:scale-95 text-center"
              >
                Discuss Project
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold px-8 py-3.5 rounded-xl transition-all active:scale-95 text-center"
              >
                Client Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
