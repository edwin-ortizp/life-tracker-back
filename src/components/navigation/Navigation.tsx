import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';

const Navigation = () => {
  const { isMobile, isTablet } = useResponsive();

  // Para tablets, decidir qué navegación usar basado en orientación y preferencias
  const shouldUseMobileNav = isMobile || (isTablet && window.innerWidth < 900);

  return (
    <>
      {shouldUseMobileNav ? <MobileNavigation /> : <DesktopNavigation />}
    </>
  );
};

export default Navigation;