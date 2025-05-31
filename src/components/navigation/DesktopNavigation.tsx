import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Timer,
  Droplet,
  CheckSquare,
  Smile,
  BookOpen,
  ChevronRight,
  UtensilsCrossed,
  LogOut,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MenuItem } from './types';
import { ClipboardList } from 'lucide-react';
import { ThumbsDown } from 'lucide-react';

export const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Inicio', path: '/' },
  { icon: Droplet, label: 'Hidratación', path: '/water' },
  { icon: Dumbbell, label: 'Ejercicio', path: '/exercise' },
  { icon: CheckSquare, label: 'Hábitos', path: '/habit' },
  { icon: Smile, label: 'Estado', path: '/mood' },
  { icon: BookOpen, label: 'Diario', path: '/journal' },
  { icon: Timer, label: 'Pomodoro', path: '/pomodoro' },
  { icon: UtensilsCrossed, label: 'Comidas', path: '/meal' },
  { icon: ClipboardList, label: 'Tareas', path: '/task' },
  { icon: ThumbsDown, label: 'Hábitos Negativos', path: '/negative' },
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

  const DesktopMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem) => {
    const isActive = location.pathname === path;

    const buttonContent = (
      <>
        <Icon className={`${isExpanded ? 'w-8 h-8' : 'w-7 h-7'} transition-all duration-200`} />
        {isExpanded && <span className="ml-3">{label}</span>}
      </>
    );

    if (!isExpanded) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full flex items-center justify-start ${isExpanded ? 'px-4 py-3' : 'p-3'}`}
                onClick={() => onClick ? onClick() : navigate(path)}
              >
                {buttonContent}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`w-full flex items-center justify-start ${isExpanded ? 'px-4 py-3' : 'p-3'}`}
        onClick={() => onClick ? onClick() : navigate(path)}
      >
        {buttonContent}
      </Button>
    );
  };

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
        <Button
          variant="ghost"
          size="icon"
          title="Expand/Collapse Menu"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 w-full flex items-center justify-center"
        >
          <ChevronRight className={`w-5 h-5 transform transition-transform duration-300 
            ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto space-y-1">
        <div className="flex-1">
          {menuItems.slice(0, -1).map((item) => (
            <DesktopMenuItem key={item.path} icon={item.icon} label={item.label} path={item.path} />
          ))}
        </div>
        <div className="border-t pt-2">
          <DesktopMenuItem icon={menuItems[menuItems.length - 1].icon} label={menuItems[menuItems.length - 1].label} path={menuItems[menuItems.length - 1].path} onClick={handleLogout} />
        </div>
      </nav>
    </aside>
  );
};

export default DesktopNavigation;