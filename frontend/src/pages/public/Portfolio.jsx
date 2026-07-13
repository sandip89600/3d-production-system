import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Calendar, Compass, Layers, Monitor, HardDrive, User, ChevronRight } from 'lucide-react';
import Card3DTilt from '../../components/public/Card3DTilt';
import BeforeAfterSlider from '../../components/public/BeforeAfterSlider';

export default function Portfolio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get('cat');
  const idParam = searchParams.get('id');

  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  const filters = ['All', 'Architecture', 'Interior', 'Exterior', 'Modeling', 'Rendering', 'Animation'];

  const projects = [
    {
      id: 1,
      title: 'Marina Sands Villa',
      category: 'Exterior',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      wireframe: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      location: 'Miami, FL',
      year: '2025',
      client: 'Sands Dev Corp',
      software: '3ds Max, V-Ray, Photoshop',
      lighting: 'HDR Sun & Sky + Ambient Ocean Bounce',
      description: 'A luxurious beachfront villa visualization emphasizing floor-to-ceiling glass panel reflectivity, custom pool shaders, and sunset ambient lighting.'
    },
    {
      id: 2,
      title: 'Nordic Minimalist Kitchen',
      category: 'Interior',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      wireframe: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      location: 'Oslo, Norway',
      year: '2025',
      client: 'Nove Interior Studio',
      software: 'Cinema 4D, Corona Renderer',
      lighting: 'Overcast Northern Daylight + Warm LEDs',
      description: 'A kitchen interior rendering showcasing matte oak texturing, custom cabinet molding, and soft shadow diffusion under overcast sky conditions.'
    },
    {
      id: 3,
      title: 'Skylight Business Tower',
      category: 'Architecture',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      wireframe: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
      location: 'Tokyo, Japan',
      year: '2024',
      client: 'Sumitomo Group',
      software: 'Revit, 3ds Max, Corona',
      lighting: 'Direct Midday Sun + Blue Sky Dome',
      description: 'High-density commercial skyscraper visualization showing structural glass facade reflectivity and complex ground-level ambient occlusion.'
    },
    {
      id: 4,
      title: 'Golden Hour Glasshouse',
      category: 'Exterior',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      wireframe: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      location: 'Zurich, Switzerland',
      year: '2025',
      client: 'Alpine Retreats',
      software: '3ds Max, V-Ray, Forest Pack',
      lighting: 'Golden Hour Sun (12 Degrees Elevation)',
      description: 'Bespoke forest retreat visualization focusing on detailed needle leaf scatter, atmospheric fog layers, and glowing indoor lighting.'
    },
    {
      id: 5,
      title: 'Amber Resonance Atrium',
      category: 'Interior',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      wireframe: 'https://images.unsplash.com/photo-1617806118233-18e1db207faf?auto=format&fit=crop&w=1200&q=80',
      location: 'London, UK',
      year: '2024',
      client: 'Gilded & Co',
      software: 'Blender, Cycles Renderer',
      lighting: 'Volumetric Sunrays + Architectural Accent Spots',
      description: 'A luxury lounge atrium design emphasizing gold leaf textures, marble grain alignments, and custom velvet furniture shaders.'
    },
    {
      id: 6,
      title: 'Villas on the Water',
      category: 'Animation',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      wireframe: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      location: 'Dubai, UAE',
      year: '2026',
      client: 'Nakhla Developers',
      software: '3ds Max, V-Ray, Unreal Engine 5',
      lighting: 'Dynamic Sun Cycles (Day-to-Night Animation)',
      description: 'Cinematic rendering for a high-end luxury resort. Utilized Unreal Engine 5 for real-time water wave simulations and animated yacht models.'
    },
    {
      id: 7,
      title: 'Bespoke Oak Armchair',
      category: 'Modeling',
      image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=80',
      wireframe: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80',
      location: 'Milan, Italy',
      year: '2025',
      client: 'Casa Mobili',
      software: 'ZBrush, Marvelous Designer, Corona',
      lighting: 'Studio 3-Point Light Setup',
      description: 'Hyper-detailed model of a custom leather and oak armchair. Micro-stitches modeled in Marvelous Designer and displacement mapped leather pores.'
    },
    {
      id: 8,
      title: 'Monolithic Concrete Pavilion',
      category: 'Rendering',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      wireframe: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80',
      location: 'Berlin, Germany',
      year: '2024',
      client: 'Bauhaus Society',
      software: '3ds Max, FStorm Renderer',
      lighting: 'Diffuse Ambient Sky + Cold Floor Spotlights',
      description: 'Material study focusing on micro-roughness properties of board-formed concrete and custom weathering/rust shader mappings.'
    }
  ];

  // Sync state with URL search params
  useEffect(() => {
    if (catParam) {
      // Capitalize first letter
      const filterName = catParam.charAt(0).toUpperCase() + catParam.slice(1).toLowerCase();
      if (filters.includes(filterName)) {
        setActiveFilter(filterName);
      }
    }
    if (idParam) {
      const proj = projects.find(p => p.id === parseInt(idParam));
      if (proj) setSelectedProject(proj);
    }
  }, [catParam, idParam]);

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    if (filter === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ cat: filter.toLowerCase() });
    }
  };

  const openLightbox = (proj) => {
    setSelectedProject(proj);
    setSearchParams(prev => {
      prev.set('id', proj.id.toString());
      return prev;
    });
  };

  const closeLightbox = () => {
    setSelectedProject(null);
    setSearchParams(prev => {
      prev.delete('id');
      return prev;
    });
  };

  const filteredProjects = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.category === activeFilter || (activeFilter === 'Architecture' && (p.category === 'Exterior' || p.category === 'Interior')));

  return (
    <div className="pt-28 pb-24 overflow-hidden">
      
      {/* Page Header */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-8">
          <div>
            <span className="text-xs uppercase font-bold text-amber-500 tracking-widest block mb-2">Our Masterpieces</span>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Portfolio</h1>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900 text-slate-400 border border-slate-850 hover:text-white hover:border-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After Highlight Slider Section */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center bg-[#070b16]/60 border border-slate-900 rounded-3xl p-8 lg:p-12">
          <div className="lg:col-span-1 flex flex-col gap-5">
            <span className="text-xs uppercase text-amber-500 font-bold tracking-widest">Interactive Compare</span>
            <h3 className="text-2xl font-bold text-white tracking-tight">From CAD Topology to Photorealism</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Slide the slider left and right to witness how we translate polygonal CAD meshes into light-mapped assets. We maintain perfect geometric scaling.
            </p>
            <div className="flex items-center gap-3 text-amber-500 font-semibold text-xs mt-2">
              <span>Try dragging the center bar</span>
              <ChevronRight className="w-4 h-4 animate-ping" />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1617806118233-18e1db207faf?auto=format&fit=crop&w=1200&q=80"
              afterImage="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
              beforeLabel="Ambient Occlusion Clay"
              afterLabel="Raytraced Final"
            />
          </div>
        </div>
      </section>

      {/* Grid Canvas */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map(proj => (
            <div
              key={proj.id}
              onClick={() => openLightbox(proj)}
              className="cursor-pointer"
            >
              <Card3DTilt intensity={10} className="rounded-2xl overflow-hidden group shadow-lg">
                <div className="bg-slate-950 border border-slate-850 aspect-[4/3] relative flex flex-col justify-end p-6">
                  {/* Image with zoom and soft blur backdrops */}
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.7] group-hover:brightness-[0.8]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                  
                  {/* Interactive details button on hover */}
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/80 border border-white/5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm shadow-md">
                    <ZoomIn className="w-4 h-4" />
                  </div>

                  <div className="relative z-10 flex flex-col gap-1.5 translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                        {proj.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{proj.location}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight">{proj.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {proj.software}
                    </p>
                  </div>
                </div>
              </Card3DTilt>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox / Project details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#020617]/96 backdrop-blur-md flex items-center justify-center p-4 lg:p-12 overflow-y-auto"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                
                {/* Visual section */}
                <div className="p-4 lg:p-6 flex flex-col justify-center bg-slate-900/30 border-r border-slate-900">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                    {/* BeforeAfterSlider inside light box for rich presentation */}
                    <BeforeAfterSlider
                      beforeImage={selectedProject.wireframe}
                      afterImage={selectedProject.image}
                      beforeLabel="Topology Mesh"
                      afterLabel="Raytraced Final"
                    />
                  </div>
                  <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold mt-4">
                    Drag the center handle to see CAD model
                  </p>
                </div>

                {/* Info section */}
                <div className="p-6 lg:p-10 flex flex-col justify-between">
                  <div className="flex flex-col gap-6">
                    <div>
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                        {selectedProject.category} Visualization
                      </span>
                      <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                        {selectedProject.title}
                      </h2>
                    </div>

                    <p className="text-sm text-slate-450 leading-relaxed">
                      {selectedProject.description}
                    </p>

                    {/* Meta metrics grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-slate-900 pt-6">
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Client</p>
                          <p className="text-xs text-slate-200 font-medium">{selectedProject.client}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Year</p>
                          <p className="text-xs text-slate-200 font-medium">{selectedProject.year}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Compass className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Location</p>
                          <p className="text-xs text-slate-200 font-medium">{selectedProject.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Monitor className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Software Stack</p>
                          <p className="text-xs text-slate-200 font-medium">{selectedProject.software}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-6 mt-8 flex flex-col gap-2.5">
                    <div className="flex items-start gap-2 text-xs">
                      <Layers className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-400">
                        <strong className="text-slate-300">Lighting Parameters:</strong> {selectedProject.lighting}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <HardDrive className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-400">
                        <strong className="text-slate-300">Target Deliverable:</strong> EXR Cinematic Frame Render (300 DPI)
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
