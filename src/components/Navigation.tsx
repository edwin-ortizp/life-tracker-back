import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  Droplet,
  CheckSquare,
  Smile,
  BookOpen,
  BarChart2,
  Settings,
  Menu,
  X
} from 'lucide-react';
import Auth from '../components/Auth';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Cerrar el menú móvil cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const mobileMenu = document.getElementById('mobile-menu');
      const menuButton = document.getElementById('menu-button');
      
      if (mobileMenu && !mobileMenu.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar el menú móvil cuando cambia la ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Timer, label: 'Pomodoro', path: '/pomodoro' },
    { icon: Droplet, label: 'Hidratación', path: '/hydration' },
    { icon: CheckSquare, label: 'Hábitos', path: '/habits' },
    { icon: Smile, label: 'Estado de ánimo', path: '/mood' },
    { icon: BookOpen, label: 'Diario', path: '/diary' },
    { icon: BarChart2, label: 'Estadísticas', path: '/stats' },
    { icon: Settings, label: 'Configuración', path: '/settings' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  interface MenuItemProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
  }

  const MenuItem = ({ icon: Icon, label, path }: MenuItemProps) => (
    <button
      className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-colors
        ${location.pathname === path 
          ? 'bg-blue-500 text-white' 
          : 'hover:bg-gray-100'
        }`}
      onClick={() => handleNavigation(path)}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-col h-full">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">Daily Tracker</h1>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <MenuItem {...item} />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile Menu Button and Overlay */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30">
        <div className="flex justify-around items-center p-2">
          <button
            id="menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {menuItems.slice(0, 4).map(({ icon: Icon, path }) => (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={`p-2 rounded-lg transition-colors
                ${location.pathname === path 
                  ? 'text-blue-500' 
                  : 'hover:bg-gray-100'
                }`}
            >
              <Icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40
          ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div
          id="mobile-menu"
          className={`fixed inset-y-0 left-0 w-64 bg-white transform transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h1 className="text-xl font-bold">Daily Tracker</h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <Auth />
            </div>

            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <MenuItem {...item} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;