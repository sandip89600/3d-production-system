import React, { useRef, useState } from 'react';

/**
 * Card3DTilt provides a smooth 3D tilt effect and interactive spotlight glare
 * that reacts to the user's mouse movements.
 */
export default function Card3DTilt({ children, className = '', intensity = 15 }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState({ opacity: 0, x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate rotation angles based on mouse offset from center
    const xc = width / 2;
    const yc = height / 2;
    const rX = ((yc - y) / yc) * intensity; // Inverted to tilt towards mouse
    const rY = ((x - xc) / xc) * intensity;

    setRotateX(rX);
    setRotateY(rY);

    // Update spotlight glare position
    setSpotlightStyle({
      opacity: 1,
      x: x,
      y: y,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setSpotlightStyle({ opacity: 0, x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-all duration-300 ease-out ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Dynamic Mouse Follow Spotlight */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-[inherit] transition-opacity duration-300 ease-out z-10"
        style={{
          opacity: spotlightStyle.opacity,
          background: `radial-gradient(400px circle at ${spotlightStyle.x}px ${spotlightStyle.y}px, rgba(245, 158, 11, 0.15), transparent 80%)`,
        }}
      />
      {/* Reflective Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out z-10"
        style={{
          opacity: spotlightStyle.opacity ? spotlightStyle.opacity * 0.4 : 0,
          background: `radial-gradient(150px circle at ${spotlightStyle.x}px ${spotlightStyle.y}px, rgba(255, 255, 255, 0.25), transparent 60%)`,
        }}
      />
      {/* Content wrapper preserving 3D space */}
      <div className="h-full w-full" style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}
