// Google Analytics 4 (GA4) Utility Helpers

export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
  if (typeof window === 'undefined' || !measurementId) return;

  const scriptId = 'google-tag-manager';
  if (!document.getElementById(scriptId)) {
    // 1. Inject the external gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.id = scriptId;
    document.head.appendChild(script);

    // 2. Setup the global dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    
    // 3. Run config (default page_view disabled so we track manually in SEO router changes)
    window.gtag('config', measurementId, {
      send_page_view: false,
    });
  }
};

export const logPageView = (path, title) => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      send_to: measurementId,
    });
  }
};

export const logEvent = (action, params = {}) => {
  if (window.gtag) {
    window.gtag('event', action, params);
  }
};
