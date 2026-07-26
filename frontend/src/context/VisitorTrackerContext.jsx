import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

// Get API base URL depending on env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VisitorTrackerContext = createContext(null);

export const useVisitorTracker = () => useContext(VisitorTrackerContext);

// Unique ID Generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Referral source parser
const getReferralSource = () => {
  const ref = document.referrer;
  if (!ref) return 'Direct';
  const lowercaseRef = ref.toLowerCase();
  
  if (lowercaseRef.includes('google.com')) return 'Google';
  if (lowercaseRef.includes('linkedin.com')) return 'LinkedIn';
  if (lowercaseRef.includes('facebook.com')) return 'Facebook';
  if (lowercaseRef.includes('instagram.com')) return 'Instagram';
  if (lowercaseRef.includes('twitter.com') || lowercaseRef.includes('t.co')) return 'Twitter';
  
  return 'Other';
};

export const VisitorTrackerProvider = ({ children }) => {
  const location = useLocation();
  const heartbeatIntervalRef = useRef(null);
  const clickCountRef = useRef(0);
  const maxScrollRef = useRef(0);
  const activePageRef = useRef(location.pathname);

  // Initialize tracking
  useEffect(() => {
    // 1. Get or create Visitor ID (persistent)
    let visitorId = localStorage.getItem('all3d_visitor_id');
    if (!visitorId) {
      visitorId = generateUUID();
      localStorage.setItem('all3d_visitor_id', visitorId);
    }

    // 2. Get or create Session ID (transient)
    let sessionId = sessionStorage.getItem('all3d_session_id');
    let isNewSession = false;
    if (!sessionId) {
      sessionId = generateUUID();
      sessionStorage.setItem('all3d_session_id', sessionId);
      isNewSession = true;
    }

    // 3. Landing page mapping
    let landingPage = sessionStorage.getItem('all3d_landing_page');
    if (!landingPage) {
      landingPage = window.location.pathname;
      sessionStorage.setItem('all3d_landing_page', landingPage);
    }

    // Start tracking session start
    const startSession = async () => {
      try {
        await axios.post(`${API_URL}/api/visitor-analytics/track/start`, {
          visitorId,
          sessionId,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language || 'en',
          referralSource: getReferralSource(),
          landingPage,
          userAgent: navigator.userAgent
        });
      } catch (err) {
        console.error('Failed to start visitor session tracking:', err.message);
      }
    };

    startSession();

    // Setup heartbeat interval (every 10 seconds)
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        await axios.post(`${API_URL}/api/visitor-analytics/track/heartbeat`, { sessionId });
      } catch (err) {
        // Silent catch for network drops
      }
    }, 10000);

    // Click tracking listener
    const handleGlobalClick = (e) => {
      clickCountRef.current += 1;
      
      // If clicked element is a button, link or has click role, log event details
      const target = e.target.closest('button, a, [role="button"]');
      if (target) {
        const text = target.innerText || target.getAttribute('aria-label') || '';
        const tag = target.tagName.toLowerCase();
        
        axios.post(`${API_URL}/api/visitor-analytics/track/event`, {
          sessionId,
          type: 'click',
          page: window.location.pathname,
          meta: {
            element: tag,
            text: text.trim().substring(0, 50),
            id: target.id || '',
            className: target.className || ''
          }
        }).catch(() => {});
      }
    };

    // Scroll depth tracking listener
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
        if (scrollPercent > maxScrollRef.current) {
          maxScrollRef.current = scrollPercent;
        }
      }
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(heartbeatIntervalRef.current);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Track page navigation changes
  useEffect(() => {
    const sessionId = sessionStorage.getItem('all3d_session_id');
    if (!sessionId) return;

    // Send page view event
    axios.post(`${API_URL}/api/visitor-analytics/track/event`, {
      sessionId,
      type: 'page_view',
      page: location.pathname,
      meta: {
        title: document.title,
        previousPage: activePageRef.current
      }
    }).catch(() => {});

    // Save current max scroll to previous page before transitioning
    if (maxScrollRef.current > 0) {
      axios.post(`${API_URL}/api/visitor-analytics/track/event`, {
        sessionId,
        type: 'scroll',
        page: activePageRef.current,
        meta: {
          scrollDepthPercent: maxScrollRef.current,
          totalClicks: clickCountRef.current
        }
      }).catch(() => {});
    }

    // Reset counters for new page
    activePageRef.current = location.pathname;
    maxScrollRef.current = 0;
    clickCountRef.current = 0;
  }, [location.pathname]);

  return (
    <VisitorTrackerContext.Provider value={{}}>
      {children}
    </VisitorTrackerContext.Provider>
  );
};
