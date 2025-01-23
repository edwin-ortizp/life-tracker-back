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
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Droplet, label: 'Hidratación', path: '/water' },
    { icon: CheckSquare, label: 'Hábitos', path: '/habit' },
    { icon: Smile, label: 'Estado de ánimo', path: '/mood' },
    { icon: BookOpen, label: 'Diario', path: '/journal' },
    { icon: Timer, label: 'Pomodoro', path: '/pomodoro' },
    { icon: UtensilsCrossed, label: 'Comidas', path: '/meal' },
    { icon: BarChart2, label: 'Tareas', path: '/task' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
    { icon: LogOut, label: 'Cerrar sesión', path: '/logout', onClick: handleLogout }
  ];

  const visibleMenuItems = menuItems.slice(0, 4);
  const expandedMenuItems = menuItems.slice(4);

  // Componente para ítem del menú desktop
  const DesktopMenuItem = ({ icon: Icon, label, path, onClick }: { icon: any, label: string, path: string, onClick?: () => void }) => (
    <div className="relative group">
      <button
        className={`w-full rounded-lg transition-colors duration-200 flex items-center
          ${location.pathname === path ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
          ${isDesktopExpanded ? 'px-4 py-3' : 'p-3'}`}
        onClick={() => onClick ? onClick() : navigate(path)}
      >
        <Icon className={`${isDesktopExpanded ? 'w-8 h-8' : 'w-7 h-7'} transition-all duration-200`} />
        {isDesktopExpanded && <span className="ml-3">{label}</span>}
      </button>
      {!isDesktopExpanded && (
        <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </div>
  );

  // Componente para ítem del menú móvil
  const MobileMenuItem = ({ icon: Icon, label, path, onClick }: { icon: any, label: string, path: string, onClick?: () => void }) => (
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
    <>
      {/* Desktop Navigation */}
      <aside className={`hidden md:flex flex-col h-screen absolute top-0 left-0 transition-all duration-300 bg-white border-r
        ${isDesktopExpanded ? 'w-64' : 'w-16'}`}>
        <div className="flex flex-col items-center space-y-2 p-3">
          {isDesktopExpanded ? (
            <h1 className="text-xl font-bold">Daily Tracker</h1>
          ) : (
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DT</span>
            </div>
          )}
          <button 
            onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
            className="p-1 hover:bg-gray-100 rounded-lg w-full flex items-center justify-center"
          >
            <ChevronRight className={`w-5 h-5 transform transition-transform duration-300 
              ${isDesktopExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto space-y-1">
          <div className="flex-1">
            {menuItems.slice(0, -1).map((item) => (
              <DesktopMenuItem key={item.path} {...item} />
            ))}
          </div>
          {/* Separador y botón de cerrar sesión */}
          <div className="border-t pt-2">
            <DesktopMenuItem {...menuItems[menuItems.length - 1]} />
          </div>
        </nav>
      </aside>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b z-30">
          <div className="flex justify-between items-center px-4 h-14">
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
              <ChevronDown className={`w-8 h-8 transform transition-transform duration-300 
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