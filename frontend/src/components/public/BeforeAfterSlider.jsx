import React, { useState, useRef, useEffect } from 'react';

/**
 * BeforeAfterSlider compares two images side-by-side using an interactive slider handle.
 * Typically used for Wireframe vs Render comparisons.
 */
export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Wireframe',
  afterLabel = 'Final Render',
  className = '',
}) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 - 100)
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMove = (clientX) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseUp);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleMouseUp);
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Before Image (Background Layer) */}
      <img
        src={beforeImage}
        alt="Before"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute top-4 left-4 rounded bg-slate-950/80 px-3 py-1 text-xs font-semibold text-slate-400 backdrop-blur-sm uppercase tracking-wider border border-white/5">
        {beforeLabel}
      </div>

      {/* After Image (Overlay Layer, Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img
          src={afterImage}
          alt="After"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          style={{ width: containerRef.current?.getBoundingClientRect().width || '100%' }}
        />
        <div className="absolute top-4 right-4 rounded bg-amber-500/80 px-3 py-1 text-xs font-semibold text-slate-950 backdrop-blur-sm uppercase tracking-wider">
          {afterLabel}
        </div>
      </div>

      {/* Slider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 w-1 cursor-ew-resize bg-amber-500 hover:bg-amber-400 active:bg-amber-300"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Glowing Slider Handle Knob */}
        <div className="absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500 bg-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform duration-200 hover:scale-110 active:scale-95">
          <div className="flex gap-[3px]">
            <span className="h-4 w-[2px] rounded-full bg-amber-500" />
            <span className="h-4 w-[2px] rounded-full bg-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
