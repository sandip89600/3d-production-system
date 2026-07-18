import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ZoomIn, ZoomOut, Maximize2, Minimize2, 
  ChevronLeft, ChevronRight, Eye, 
  Layers, Cpu, User, RefreshCw
} from 'lucide-react';
import Layout from '../../components/public/Layout';
import Card3DTilt from '../../components/public/Card3DTilt';
import ProgressiveImage from '../../components/public/ProgressiveImage';
import { allGalleryImages } from '../../utils/galleryData';

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get('cat');
  const idParam = searchParams.get('id');

  const [activeFilter, setActiveFilter] = useState('All');
  const [activeFilename, setActiveFilename] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);
  
  // Touch swipe support state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Keyboard navigation support
  const lightboxRef = useRef(null);

  const filters = [
    'All', 
    'Interior', 
    'Exterior', 
    'Architecture', 
    'Rendering', 
    'Modeling', 
    'Walkthrough', 
    'Animation', 
    'Furniture'
  ];

  // Filter images based on selected category
  const filteredImages = allGalleryImages.filter(img => {
    if (activeFilter === 'All') return true;
    return img.category.toLowerCase() === activeFilter.toLowerCase();
  });

  // Sync category state with query parameters
  useEffect(() => {
    if (catParam) {
      const match = filters.find(f => f.toLowerCase() === catParam.toLowerCase());
      if (match) {
        setActiveFilter(match);
      }
    }
  }, [catParam]);

  // Sync active filename with ID param if present
  useEffect(() => {
    if (idParam) {
      const imgExists = allGalleryImages.some(img => img.id === idParam || img.filename === idParam);
      if (imgExists) {
        const targetImg = allGalleryImages.find(img => img.id === idParam || img.filename === idParam);
        setActiveFilename(targetImg.id);
        
        // Auto-select category of this image so the layout matches context
        if (targetImg && activeFilter !== 'All' && activeFilter.toLowerCase() !== targetImg.category.toLowerCase()) {
          setActiveFilter(targetImg.category);
        }
      }
    } else {
      setActiveFilename(null);
    }
  }, [idParam]);

  // Keyboard listeners for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeFilename) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilename, filteredImages]);

  // Close full-screen lightbox
  const closeLightbox = () => {
    setActiveFilename(null);
    setZoomScale(1);
    
    // Remove ID query param while maintaining category
    const params = new URLSearchParams(searchParams);
    params.delete('id');
    setSearchParams(params);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  };

  // Open lightbox
  const openLightbox = (id) => {
    setActiveFilename(id);
    setZoomScale(1);
    
    const params = new URLSearchParams(searchParams);
    params.set('id', id);
    
    const img = allGalleryImages.find(i => i.id === id || i.filename === id);
    if (img) {
      params.set('cat', img.category.toLowerCase());
    }
    
    setSearchParams(params);
  };

  // Switch index relative to current filtered view
  const getIndex = () => {
    return filteredImages.findIndex(img => img.id === activeFilename);
  };

  const nextSlide = () => {
    if (filteredImages.length === 0) return;
    setZoomScale(1);
    const currIdx = getIndex();
    const nextIdx = (currIdx + 1) % filteredImages.length;
    openLightbox(filteredImages[nextIdx].id);
  };

  const prevSlide = () => {
    if (filteredImages.length === 0) return;
    setZoomScale(1);
    const currIdx = getIndex();
    const prevIdx = (currIdx - 1 + filteredImages.length) % filteredImages.length;
    openLightbox(filteredImages[prevIdx].id);
  };

  // Zoom management
  const zoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.75));

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const element = lightboxRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Handle Touch Swipes
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      nextSlide(); // Swipe left -> Next
    } else if (diff < -50) {
      prevSlide(); // Swipe right -> Prev
    }
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    setVisibleCount(16); // reset loaded items count
    
    const params = new URLSearchParams(searchParams);
    if (filter === 'All') {
      params.delete('cat');
    } else {
      params.set('cat', filter.toLowerCase());
    }
    params.delete('id'); // close details view on filter change
    setSearchParams(params);
  };

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 16, filteredImages.length));
  };

  // Resolve active image from global database to be resilient against filters
  const activeImage = allGalleryImages.find(img => img.id === activeFilename || img.filename === activeFilename);
  const activeIndex = getIndex();

  return (
    <div className="pt-28 pb-24 min-h-screen bg-[#020617] text-white">
      
      {/* Cinematic Header Banner */}
      <section className="relative px-6 lg:px-12 max-w-7xl mx-auto mb-16">
        <div className="text-center max-w-3xl mx-auto flex flex-col gap-5">
          <span className="text-xs uppercase font-bold text-amber-500 tracking-[0.25em] bg-amber-500/10 px-4 py-1.5 rounded-full w-fit mx-auto border border-amber-500/25">
            Render Database
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Comprehensive <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              3D Studio Gallery
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Browse through our full archive of 3D visual outputs and plans. Millimeter CAD scale and physical lighting equations applied across all projects.
          </p>
        </div>
      </section>

      {/* Categories Navigation Bar */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-12">
        <div className="flex flex-wrap justify-center gap-2 border-b border-slate-900 pb-6">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterClick(filter)}
              className={`px-5 py-2 text-xs font-semibold tracking-wider uppercase rounded-full transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/10 scale-105'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Content Masonry */}
      <section className="px-6 lg:px-12 max-w-7xl mx-auto">
        {filteredImages.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-slate-900 rounded-3xl">
            <p className="text-slate-400 text-sm">No renderings found in this category.</p>
            <button 
              onClick={() => handleFilterClick('All')}
              className="btn-primary mt-4 scale-95"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Columns Masonry Grid */}
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
              <AnimatePresence mode="popLayout">
                {filteredImages.slice(0, visibleCount).map((img) => (
                  <motion.div
                    layout
                    key={img.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="break-inside-avoid rounded-2xl overflow-hidden shadow-xl"
                  >
                    <Card3DTilt intensity={8} className="rounded-2xl border border-slate-900 overflow-hidden shadow-2xl bg-slate-900/40">
                      {/* Clickable Image Container to trigger Lightbox */}
                      <div 
                        onClick={() => openLightbox(img.id)}
                        className="relative group cursor-pointer overflow-hidden aspect-[4/3] sm:aspect-auto"
                      >
                        <ProgressiveImage
                          src={img.thumbUrl}
                          placeholderSrc={null}
                          alt={img.title}
                          className="w-full"
                          imgClassName="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                          priority={2}
                        />
                        
                        {/* Premium Hover Overlay (Glassmorphism + Gradients) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 z-20">
                          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-1 block">
                            {img.category}
                          </span>
                          <h3 className="text-sm font-semibold text-white truncate max-w-full">
                            {img.title}
                          </h3>
                          
                          {/* Project metadata */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                            <span className="text-[10px] text-slate-400">
                              {img.client}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(img.id);
                              }}
                              className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-full transition-all shadow-md shadow-amber-500/20"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card3DTilt>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {visibleCount < filteredImages.length && (
              <div className="text-center mt-16">
                <button
                  onClick={loadMore}
                  className="group px-8 py-3.5 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-full font-semibold text-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-850 flex items-center gap-2.5 mx-auto hover:shadow-lg hover:shadow-amber-500/5"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Load More Projects ({filteredImages.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activeFilename && activeImage && (
          <motion.div
            ref={lightboxRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/98 backdrop-blur-xl select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            
            {/* Lightbox Header Bar */}
            <div className="flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-slate-950/80 to-transparent z-30">
              
              {/* Counter & Category */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  {activeImage.category}
                </span>
                <span className="text-xs text-slate-400">
                  {activeIndex !== -1 ? `${activeIndex + 1} / ${filteredImages.length}` : 'Detail Mode'}
                </span>
              </div>

              {/* Control Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={zoomOut}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 md:w-5 h-5" />
                </button>
                <button 
                  onClick={zoomIn}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 md:w-5 h-5" />
                </button>
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 md:w-5 h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 h-5" />}
                </button>
                <button 
                  onClick={closeLightbox}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition-colors"
                  title="Close (ESC)"
                >
                  <X className="w-5 h-5 md:w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Lightbox Center Content (Carousel + Nav Arrows) */}
            <div className="flex-grow flex items-center justify-between px-4 relative overflow-hidden">
              
              {/* Previous Slide Arrow */}
              <button
                onClick={prevSlide}
                className="absolute left-4 z-30 p-3 rounded-full bg-slate-900/60 border border-slate-800 text-slate-350 hover:text-white hover:bg-slate-900 hover:border-slate-700 transition-all shadow-xl hidden md:block"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Image display container */}
              <div className="w-full h-full flex items-center justify-center p-2 relative overflow-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImage.path}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      transform: `scale(${zoomScale})`,
                    }}
                    className="max-w-full max-h-[80vh] md:max-h-[75vh] select-none transition-transform duration-200"
                  >
                    <ProgressiveImage
                      src={activeImage.url}
                      placeholderSrc={activeImage.thumbUrl}
                      alt={activeImage.title}
                      className="max-w-full max-h-[80vh] md:max-h-[75vh] rounded-lg shadow-2xl overflow-hidden"
                      imgClassName="max-w-full max-h-[80vh] md:max-h-[75vh] object-contain"
                      priority={10}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Next Slide Arrow */}
              <button
                onClick={nextSlide}
                className="absolute right-4 z-30 p-3 rounded-full bg-slate-900/60 border border-slate-800 text-slate-350 hover:text-white hover:bg-slate-900 hover:border-slate-700 transition-all shadow-xl hidden md:block"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Footer Metadata (Detailed spec sheet overlay) */}
            <div className="p-4 md:p-6 bg-gradient-to-t from-slate-950 to-transparent z-30">
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                    {activeImage.category} → Project Spec Sheet
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                    {activeImage.title}
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-slate-900 pt-3 md:border-t-0 md:pt-0">
                  {[
                    { icon: User, label: 'Client', val: activeImage.client },
                    { icon: Cpu, label: 'Engine', val: 'Corona / UE5' },
                    { icon: Layers, label: 'Layers', val: 'CAD High-Mesh' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-900/40 rounded-xl p-2.5 border border-white/5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <item.icon className="w-3 h-3 text-amber-500/80" />
                        <span className="text-[8px] uppercase tracking-wider font-semibold">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-white font-semibold truncate mt-0.5">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
