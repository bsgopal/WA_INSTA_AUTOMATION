// renic-automation-frontend/src/hooks/useScreenTracker.js
import { useEffect, useRef, useCallback } from 'react';
import tenantGateway from '../services/clientGateway';

/**
 * React Hook for automatic screen tracking and action telemetry.
 * Logs duration spent on screen and user actions to Renic_Soft HQ.
 */
export function useScreenTracker(screenName) {
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    mountTimeRef.current = Date.now();

    // Log screen view on entry
    tenantGateway.logScreenActivity({
      screenName,
      actionType: 'VIEW',
      actionDescription: `Navigated to ${screenName}`
    });

    // On unmount, calculate total time spent
    return () => {
      const elapsedSeconds = (Date.now() - mountTimeRef.current) / 1000;
      if (elapsedSeconds > 1) {
        tenantGateway.logScreenActivity({
          screenName,
          actionType: 'VIEW',
          actionDescription: `Spent ${Math.round(elapsedSeconds)}s on ${screenName}`,
          durationSeconds: elapsedSeconds
        });
      }
    };
  }, [screenName]);

  // Helper for tracking specific user actions on the screen
  const trackAction = useCallback((actionType, actionDescription = '', metadata = {}) => {
    tenantGateway.logScreenActivity({
      screenName,
      actionType,
      actionDescription,
      durationSeconds: 0,
      metadata
    });
  }, [screenName]);

  return { trackAction };
}

export default useScreenTracker;
