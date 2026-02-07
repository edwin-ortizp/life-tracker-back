import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * Uses both screen width and user agent detection
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check both screen width and touch capability
    const checkMobile = () => {
      const widthCheck = window.innerWidth < breakpoint;
      const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Consider it mobile if width is small OR it's a touch device with mobile UA
      setIsMobile(widthCheck || (touchCheck && userAgentCheck));
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to detect if the device is specifically Android
 */
export function useIsAndroid(): boolean {
  const [isAndroid, setIsAndroid] = useState<boolean>(false);

  useEffect(() => {
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  return isAndroid;
}

/**
 * Hook to detect if the device is specifically iOS
 */
export function useIsIOS(): boolean {
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  return isIOS;
}