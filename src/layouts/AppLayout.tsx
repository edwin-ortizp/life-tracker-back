import { Outlet } from 'react-router-dom';
import Navigation from '../components/navigation/Navigation';
import { Toaster } from '@/components/ui/sonner';

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Navigation component se encarga de su propia responsividad */}
      <Navigation />

      {/* Main content - Con margin adaptativo basado en el estado de la navegación */}
      <div className="flex-1 flex flex-col main-content-adaptive overflow-hidden">
        {/* Espaciado para header móvil */}
        <div className="pt-16 md:pt-0 flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto scroll-container">
            <Outlet />
          </main>
        </div>
        {/* Espaciado para navegación móvil */}
        <div className="pb-16 md:pb-0" />
      </div>
      <Toaster />
    </div>
  );
};

export default AppLayout;