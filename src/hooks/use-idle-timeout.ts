
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

/**
 * A custom hook to detect user inactivity and trigger a callback.
 * @param onIdle - The function to call when the user is idle.
 * @param timeout - The inactivity timeout in milliseconds.
 */
export function useIdleTimeout(onIdle: () => void, timeout: number) {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    timeoutIdRef.current = setTimeout(onIdle, timeout);
  }, [onIdle, timeout]);

  const handleEvent = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Set the initial timer
    resetTimer();

    // Add event listeners for user activity
    events.forEach(event => window.addEventListener(event, handleEvent));

    // Cleanup function
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      events.forEach(event => window.removeEventListener(event, handleEvent));
    };
  }, [resetTimer, handleEvent]); // Rerun effect if callbacks change

  return {};
}
