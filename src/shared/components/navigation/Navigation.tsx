import { useResponsive } from '@/shared/hooks/useResponsive';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';

const Navigation = () => {
  const { shouldShowDesktopNav } = useResponsive();

  // Usar navegación móvil cuando no se debe mostrar la navegación de escritorio
  const shouldUseMobileNav = !shouldShowDesktopNav;

  return (
    <>
      {shouldUseMobileNav ? <MobileNavigation /> : <DesktopNavigation />}
    </>
  );
};

export default Navigation;