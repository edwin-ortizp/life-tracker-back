import { Outlet } from 'react-router-dom';
import Navigation from '../components/navigation/Navigation';
import { Toaster } from '@/components/ui/sonner';

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Navigation component se encarga de su propia responsividad */}
      <Navigation />

      {/* Main content */}
      <div className="flex-1 md:pl-16">
        <main className="h-screen overflow-y-auto">
          <div className="">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default AppLayout;