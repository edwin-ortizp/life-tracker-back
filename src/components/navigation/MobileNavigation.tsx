import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { menuItems } from './DesktopNavigation';
import type { MenuItem } from './types';

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const visibleMenuItems = menuItems.slice(0, 4);
  const expandedMenuItems = menuItems.slice(4);

  const MobileMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem) => (
    <button
      className={`flex flex-col items-center justify-center px-2 py-1
        ${location.pathname === path ? 'text-blue-500' : 'text-gray-600'}`}
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          navigate(path);
        }
        setIsMenuOpen(false);
      }}
    >
      <Icon className="w-8 h-8" />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
    <div className="fixed top-0 left-0 right-0 bg-indigo-600 border-b z-30">
      <div className="flex justify-between items-center px-4 h-14">
        <h1 className="text-xl font-bold text-white">Daily Tracker</h1>
      </div>
    </div>

      {/* Overlay for expanded menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Expanded Menu */}
      <div
        className={`fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg transform transition-transform duration-300 ease-in-out z-40
          ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="px-2 py-4">
          <div className="grid grid-cols-4 gap-4">
            {expandedMenuItems.map((item) => (
              <MobileMenuItem 
                key={item.path} 
                {...item} 
                onClick={item.path === '/logout' ? handleLogout : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <nav className="flex justify-between items-center px-2 py-1">
          {visibleMenuItems.map((item) => (
            <MobileMenuItem key={item.path} {...item} />
          ))}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center justify-center px-2 py-1 
              ${isMenuOpen ? 'text-blue-500' : 'text-gray-600'}`}
          >
            <ChevronDown className={`w-8 h-8 transform transition-transform duration-300 
              ${isMenuOpen ? 'rotate-180' : ''}`} />
            <span className="text-xs mt-1">Más</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default MobileNavigation;