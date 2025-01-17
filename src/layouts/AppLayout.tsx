import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with Navigation */}
      <div className="hidden md:flex w-64 bg-white border-r">
        <Navigation />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-auto">
        <main className="flex-1 p-6 mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile navigation is handled inside Navigation component */}
    </div>
  );
};

export default AppLayout;