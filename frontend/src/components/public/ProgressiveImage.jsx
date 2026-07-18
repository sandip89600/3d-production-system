import React, { useState, useEffect, useRef } from 'react';
import { imageLoadManager } from '../../utils/imageLoadManager';

export default function ProgressiveImage({
  src,
  placeholderSrc,
  alt,
  className = '',
  priority = 0,
  imgClassName = 'w-full h-full object-cover'
}) {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');
  const [status, setStatus] = useState('idle'); // 'idle', 'in-queue', 'loading', 'loaded', 'error'
  const containerRef = useRef(null);

  useEffect(() => {
    let observer;
    let isMounted = true;
    let isReleased = false;

    const startLoading = async () => {
      if (!isMounted) return;
      setStatus('in-queue');
      
      // Request slot from load balancer
      await imageLoadManager.requestLoad(priority);
      
      if (!isMounted) {
        imageLoadManager.release();
        return;
      }

      setStatus('loading');
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        if (isMounted) {
          setCurrentSrc(src);
          setStatus('loaded');
        }
        if (!isReleased) {
          isReleased = true;
          imageLoadManager.release();
        }
      };

      img.onerror = () => {
        if (isMounted) {
          setStatus('error');
        }
        if (!isReleased) {
          isReleased = true;
          imageLoadManager.release();
        }
      };
    };

    // Intersection observer to trigger lazy loading
    if (containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startLoading();
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '150px' } // Load slightly before it enters viewport
      );
      observer.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      if (observer && containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      if (status === 'loading' && !isReleased) {
        imageLoadManager.release();
      }
    };
  }, [src, priority]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-950/40 ${className}`}
    >
      {/* Blurred Placeholder image or loading spinner */}
      {placeholderSrc && status !== 'loaded' && (
        <img
          src={placeholderSrc}
          alt={alt}
          className={`${imgClassName} transition-opacity duration-500 absolute inset-0 filter blur-md scale-105 opacity-60 pointer-events-none`}
        />
      )}

      {/* Main Image */}
      {status !== 'idle' && status !== 'in-queue' && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${imgClassName} transition-all duration-700 ease-out ${
            status === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-xs'
          }`}
        />
      )}

      {/* Glow highlight or skeleton for loading status */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] pointer-events-none" />
      )}
    </div>
  );
}
