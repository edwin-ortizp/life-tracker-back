import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface ResponsiveState {
  deviceType: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  shouldShowDesktopNav: boolean;
}

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        orientation: 'landscape',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1920,
        screenHeight: 1080,
        shouldShowDesktopNav: true
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const shouldShowDesktopNav = width >= 768;
    
    return {
      deviceType: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      orientation: width < height ? 'portrait' : 'landscape',
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      shouldShowDesktopNav
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const shouldShowDesktopNav = width >= 768;
      
      setState({
        deviceType: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
        orientation: width < height ? 'portrait' : 'landscape',
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        shouldShowDesktopNav
      });
    };

    // Escuchar cambios de orientación específicos para móviles
    const handleOrientationChange = () => {
      // Delay para esperar a que se complete el cambio de orientación
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return state;
};

// Hook adicional para detectar si es PWA instalada
export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detectar si la PWA está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Escuchar el evento de instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
      return true;
    }
    
    return false;
  };

  return { isInstalled, canInstall, promptInstall };
};
