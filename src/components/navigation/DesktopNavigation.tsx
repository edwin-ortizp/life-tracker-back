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
  ChevronRight,
  UtensilsCrossed,
  LogOut,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MenuItem } from './types';

export const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Inicio', path: '/' },
  { icon: Droplet, label: 'Hidratación', path: '/water' },
  { icon: Dumbbell, label: 'Ejercicio', path: '/exercise' },
  { icon: CheckSquare, label: 'Hábitos', path: '/habit' },
  { icon: Smile, label: 'Estado', path: '/mood' },
  { icon: BookOpen, label: 'Diario', path: '/journal' },
  { icon: Timer, label: 'Pomodoro', path: '/pomodoro' },
  { icon: UtensilsCrossed, label: 'Comidas', path: '/meal' },
  { icon: BarChart2, label: 'Tareas', path: '/task' },
  { icon: Settings, label: 'Negativo', path: '/negative' },
  { icon: LogOut, label: 'Salir', path: '/logout' }
];

const DesktopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const DesktopMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem) => (
    <div className="relative group">
      <button
        className={`w-full rounded-lg transition-colors duration-200 flex items-center
          ${location.pathname === path ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
          ${isExpanded ? 'px-4 py-3' : 'p-3'}`}
        onClick={() => onClick ? onClick() : navigate(path)}
      >
        <Icon className={`${isExpanded ? 'w-8 h-8' : 'w-7 h-7'} transition-all duration-200`} />
        {isExpanded && <span className="ml-3">{label}</span>}
      </button>
      {!isExpanded && (
        <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </div>
  );

  return (
    <aside className={`hidden md:flex flex-col h-screen fixed top-0 left-0 transition-all duration-300 bg-white border-r z-50
      ${isExpanded ? 'w-64' : 'w-16'}`}>
      <div className="flex flex-col items-center space-y-2 p-3">
        {isExpanded ? (
          <h1 className="text-xl font-bold">Daily Tracker</h1>
        ) : (
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DT</span>
          </div>
        )}
        <button 
          type="button"
          title="Expand/Collapse Menu"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-lg w-full flex items-center justify-center"
        >
          <ChevronRight className={`w-5 h-5 transform transition-transform duration-300 
            ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto space-y-1">
        <div className="flex-1">
          {menuItems.slice(0, -1).map((item) => (
            <DesktopMenuItem key={item.path} {...item} />
          ))}
        </div>
        <div className="border-t pt-2">
          <DesktopMenuItem {...menuItems[menuItems.length - 1]} onClick={handleLogout} />
        </div>
      </nav>
    </aside>
  );
};

export default DesktopNavigation;