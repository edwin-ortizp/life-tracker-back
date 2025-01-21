import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Navigation component se encarga de su propia responsividad */}
      <Navigation />

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-auto md:pl-16">
        <main className="flex-1 p-6 mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;