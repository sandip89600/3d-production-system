import React, { useEffect, useState } from 'react';

/**
 * FloatingRenders houses multiple layered panels (render images, statistics, and floor plans)
 * that drift independently in zero-gravity and move in parallax response to mouse movements.
 */
export default function FloatingRenders({ className = '' }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse position between -0.5 and 0.5
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={`relative w-full h-[600px] lg:h-[750px] overflow-visible ${className}`}>
      
      {/* Background Glow Orb */}
      <div 
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[90px] pointer-events-none transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 25}px)`,
        }}
      />

      {/* Layer 1: Distant Render Card (Slow movement, deep Z) */}
      <div
        className="absolute top-[10%] left-[5%] w-[45%] aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800/40 shadow-2xl transition-transform duration-700 ease-out pointer-events-none"
        style={{
          transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px) scale(0.95)`,
          zIndex: 5,
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
          alt="Exterior luxury villa render"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      {/* Layer 2: Mid-ground Render Card (Normal movement) */}
      <div
        className="absolute bottom-[15%] right-[5%] w-[50%] aspect-[16/10] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl transition-transform duration-500 ease-out z-10"
        style={{
          transform: `translate(${mousePos.x * -35}px, ${mousePos.y * -35}px)`,
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
          alt="Luxury living room render"
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div>
            <p className="text-xs uppercase text-amber-500 font-bold tracking-widest">Interior Render</p>
            <h4 className="text-sm font-semibold text-white">Penthouse Suite Lounge</h4>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-white/5">0.02s Raytrace</span>
        </div>
      </div>

      {/* Layer 3: Floor Plan Blueprint Card (Faster, foreground) */}
      <div
        className="absolute top-[35%] right-[10%] w-[32%] aspect-square rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-4 shadow-xl transition-transform duration-300 ease-out z-20"
        style={{
          transform: `translate(${mousePos.x * -60}px, ${mousePos.y * -60}px) rotate(3deg)`,
        }}
      >
        <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold mb-2">Technical Blueprints</p>
        <div className="w-full h-[80%] rounded-lg border border-slate-800 bg-slate-950/50 p-2 overflow-hidden flex items-center justify-center">
          {/* Mock Vector CAD Drawing */}
          <svg className="w-full h-full text-blue-400/30" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
            <rect x="5" y="5" width="90" height="90" />
            <line x1="5" y1="35" x2="95" y2="35" />
            <line x1="45" y1="5" x2="45" y2="95" />
            <circle cx="45" cy="35" r="20" strokeDasharray="2,2" />
            <path d="M 20 20 L 20 80 L 80 80 L 80 20 Z" strokeWidth="0.8" stroke="currentColor" className="text-blue-400" />
            <path d="M 30 50 L 30 70 M 60 50 L 60 70" stroke="currentColor" className="text-amber-500/70" />
            <text x="25" y="30" fontSize="4" fill="currentColor" stroke="none" className="text-slate-400">BEDROOM 01</text>
            <text x="55" y="30" fontSize="4" fill="currentColor" stroke="none" className="text-slate-400">TERRACE</text>
          </svg>
        </div>
      </div>

      {/* Layer 4: Floating Materials / Swatch Sample Card */}
      <div
        className="absolute bottom-[8%] left-[10%] w-[30%] aspect-[1.5] rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 p-3 shadow-lg transition-transform duration-200 ease-out z-30 flex items-center gap-3"
        style={{
          transform: `translate(${mousePos.x * -80}px, ${mousePos.y * -80}px) rotate(-2deg)`,
        }}
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=150&q=80"
            alt="Marble swatch"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h5 className="text-xs font-semibold text-slate-200">Carrara Quartz</h5>
          <p className="text-[10px] text-slate-400">Material Shader</p>
          <div className="flex gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="w-2 h-2 rounded-full bg-slate-600" />
          </div>
        </div>
      </div>

      {/* Layer 5: Completion Stats Card (High Speed, Foreground Z) */}
      <div
        className="absolute top-[20%] left-[38%] rounded-xl bg-slate-900/90 backdrop-blur-lg border border-amber-500/30 p-4 shadow-2xl transition-transform duration-150 ease-out z-40"
        style={{
          transform: `translate(${mousePos.x * -100}px, ${mousePos.y * -100}px)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active Renders</p>
            <h3 className="text-xl font-bold text-white tracking-tight">99.8% Perfect</h3>
            <p className="text-[9px] text-slate-500">Photorealism Target Reached</p>
          </div>
        </div>
      </div>

      {/* Layer 6: Ambient Particle Effects */}
      <div 
        className="absolute inset-0 pointer-events-none transition-transform duration-1000 ease-out opacity-40 z-0"
        style={{
          transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)`,
        }}
      >
        <span className="absolute top-[15%] left-[60%] w-1.5 h-1.5 rounded-full bg-amber-500/60 blur-[1px]" />
        <span className="absolute top-[50%] left-[20%] w-2 h-2 rounded-full bg-blue-400/40 blur-[1px]" />
        <span className="absolute bottom-[30%] left-[80%] w-1 h-1 rounded-full bg-white/50 blur-[0.5px]" />
        <span className="absolute bottom-[60%] left-[45%] w-2.5 h-2.5 rounded-full bg-amber-500/30 blur-[2px]" />
      </div>

    </div>
  );
}
