'use client';
import { useEffect, useRef } from 'react';

export function useActivityTracker() {
  const lastSent = useRef<number>(0);

  const sendEvent = async (eventType: string, metadata?: any) => {
    const now = Date.now();
    if (now - lastSent.current < 2000 && eventType === 'tab_visible') return;
    lastSent.current = now;

    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, metadata }),
      });
    } catch {}
  };

  useEffect(() => {
    const onVisibility = () => {
      sendEvent(document.visibilityState === 'hidden' ? 'tab_hidden' : 'tab_visible');
    };
    const onBlur = () => sendEvent('window_blur');
    const onFocus = () => sendEvent('window_focus');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
}