import React, { useEffect, useRef } from 'react';

export default function GoogleAuthButton({ onSuccess, onError, text = 'signin_with' }) {
  const googleBtnRef = useRef(null);

  useEffect(() => {
    // 1. Inject Google Identity Services Script dynamically if not already loaded
    const scriptId = 'google-gsi-client-script';
    let script = document.getElementById(scriptId);

    const initializeGoogleButton = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '104618776652-32o2rjg5g14l3d35u6vdbn6v82a8k8a8.apps.googleusercontent.com', // fallback default sandbox ID if not configured
          callback: (response) => {
            if (onSuccess) onSuccess(response.credential);
          },
        });

        window.google.accounts.id.renderButton(
          googleBtnRef.current,
          {
            theme: 'dark',
            size: 'large',
            text: text, // 'signin_with', 'signup_with', 'continue_with'
            shape: 'rectangular',
            width: '100%',
            logo_alignment: 'left',
          }
        );
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleButton;
      document.head.appendChild(script);
    } else {
      initializeGoogleButton();
    }
  }, [onSuccess, text]);

  return (
    <div className="w-full flex justify-center mt-4">
      <div ref={googleBtnRef} className="w-full min-h-[44px]"></div>
    </div>
  );
}
