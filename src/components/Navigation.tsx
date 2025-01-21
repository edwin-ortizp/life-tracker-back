import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Timer,
  Droplet,
  CheckSquare,
  Smile,
  BookOpen,
  BarChart2,
  Settings,
  ChevronDown
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Timer, label: 'Pomodoro', path: '/pomodoro' },
    { icon: Droplet, label: 'Hidratación', path: '/hydration' },
    { icon: CheckSquare, label: 'Hábitos', path: '/habit' },
    { icon: Smile, label: 'Estado de ánimo', path: '/mood' },
    { icon: BookOpen, label: 'Diario', path: '/diary' },
    { icon: BarChart2, label: 'Estadísticas', path: '/stats' },
    { icon: Settings, label: 'Configuración', path: '/settings' }
  ];

  // Solo los primeros 4 items para el menú móvil visible
  const visibleMenuItems = menuItems.slice(0, 4);
  // Items restantes para el menú expandible
  const expandedMenuItems = menuItems.slice(4);

  // Componente para ítem del menú desktop
  const DesktopMenuItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => (
    <button
      className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left
        ${location.pathname === path ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
      onClick={() => navigate(path)}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  // Componente para ítem del menú móvil
  const MobileMenuItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => (
    <button
      className={`flex flex-col items-center justify-center px-2 py-1
        ${location.pathname === path ? 'text-blue-500' : 'text-gray-600'}`}
      onClick={() => {
        navigate(path);
        setIsMenuOpen(false);
      }}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block h-full">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">Daily Tracker</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <DesktopMenuItem {...item} />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b z-30">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-xl font-bold">Daily Tracker</h1>
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
                <MobileMenuItem key={item.path} {...item} />
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
              <ChevronDown className={`w-6 h-6 transform transition-transform duration-300 
                ${isMenuOpen ? 'rotate-180' : ''}`} />
              <span className="text-xs mt-1">Más</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navigation;