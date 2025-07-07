import { Outlet } from 'react-router-dom';
import Navigation from '../components/navigation/Navigation';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import PWAStatus from '../components/PWAStatus';
import MobileGestures from '../components/MobileGestures';
import AppFooter from '../components/AppFooter';
import { Toaster } from '@/components/ui/sonner';

const AppLayout = () => {
  return (
    <MobileGestures>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Navigation component se encarga de su propia responsividad */}
        <Navigation />

        {/* Main content - Con margin adaptativo basado en el estado de la navegación */}
        <div className="flex-1 flex flex-col main-content-adaptive overflow-hidden">
          {/* Espaciado para header móvil */}
          <div className="pt-0 flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto scroll-container">
              <Outlet />
            </main>
          </div>
          {/* VS Code-style Footer */}
          <AppFooter />
          {/* Espaciado para navegación móvil */}
          <div className="pb-16 md:pb-0" />
        </div>
        
        {/* PWA Components */}
        <PWAStatus />
        <PWAInstallPrompt />
        <Toaster />
      </div>
    </MobileGestures>
  );
};

export default AppLayout;