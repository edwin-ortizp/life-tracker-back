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
import { ClipboardList, ThumbsDown, Kanban as KanbanIcon } from 'lucide-react';

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
  { icon: KanbanIcon, label: 'Kanban', path: '/kanban' },
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
  };  const DesktopMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem) => {
    const isActive = location.pathname === path;
    
    const buttonContent = (
      <>
        <Icon className={`w-5 h-5 flex-shrink-0 ${
          isActive ? 'text-white' : 'text-gray-600'
        }`} />
        {isExpanded && (
          <span className={`ml-3 font-medium truncate ${
            isActive ? 'text-white' : 'text-gray-700'
          }`}>
            {label}
          </span>
        )}
      </>
    );

    const baseClasses = `
      w-full flex items-center justify-start rounded-xl transition-colors duration-150
      ${isExpanded ? 'px-4 py-3' : 'p-3'} 
      ${isActive 
        ? 'gradient-bg-primary text-white shadow-lg' 
        : 'hover:bg-white/20'
      }
    `;

    if (!isExpanded) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={baseClasses}
                onClick={() => onClick ? onClick() : navigate(path)}
              >
                {buttonContent}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-black text-white border-gray-700">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button
        variant="ghost"
        className={baseClasses}
        onClick={() => onClick ? onClick() : navigate(path)}
      >
        {buttonContent}
      </Button>
    );
  };
  return (
    <aside className={`hidden md:flex flex-col h-screen fixed top-0 left-0 transition-all duration-300 glass-card z-50 border-r-0
      ${isExpanded ? 'w-64' : 'w-16'}`}>
      <div className="flex flex-col items-center space-y-3 p-4">
        {isExpanded ? (
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Daily Tracker
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Organiza tu vida</p>
          </div>
        ) : (
          <div className="w-10 h-10 gradient-bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">DT</span>
          </div>
        )}        <Button
          variant="ghost"
          size="icon"
          title="Expand/Collapse Menu"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white/20 rounded-lg"
        >
          <ChevronRight className={`w-4 h-4 transform transition-transform duration-200 
            ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto space-y-2">
        <div className="flex-1 space-y-1">
          {menuItems.slice(0, -1).map((item) => (
            <DesktopMenuItem key={item.path} icon={item.icon} label={item.label} path={item.path} />
          ))}
        </div>
        <div className="border-t border-white/20 pt-3 mt-auto">
          <DesktopMenuItem 
            icon={menuItems[menuItems.length - 1].icon} 
            label={menuItems[menuItems.length - 1].label} 
            path={menuItems[menuItems.length - 1].path} 
            onClick={handleLogout} 
          />
        </div>
      </nav>
    </aside>
  );
};

export default DesktopNavigation;