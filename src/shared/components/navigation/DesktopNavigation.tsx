import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  LayoutDashboard,
  Timer,
  Droplet,
  CheckSquare,
  Smile,
  BookOpen,
  ChevronRight,
  UtensilsCrossed,
  Dumbbell,
  Flag
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { MenuItem } from './types';
import { ClipboardList, ThumbsDown, Kanban as KanbanIcon, BarChart } from 'lucide-react';

export const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Inicio', path: '/' },
  { icon: Droplet, label: 'Hidratacion', path: '/water/view/daily' },
  { icon: Dumbbell, label: 'Ejercicio', path: '/exercise/view/daily' },
  { icon: CheckSquare, label: 'Habitos', path: '/habit/view/tracker' },
  { icon: Smile, label: 'Estado', path: '/mood/view/tracker' },
  { icon: BookOpen, label: 'Diario', path: '/journal/view/entries' },
  { icon: Timer, label: 'Pomodoro', path: '/pomodoro/view/timer' },
  { icon: UtensilsCrossed, label: 'Comidas', path: '/meal/view/weekly' },
  { icon: ClipboardList, label: 'Tareas', path: '/task/view/list' },
  { icon: KanbanIcon, label: 'Kanban', path: '/task/view/kanban' },
  { icon: Flag, label: 'Objetivos', path: '/goals' },
  { icon: BarChart, label: 'Estadisticas', path: '/stats' },
  { icon: ThumbsDown, label: 'Habitos Negativos', path: '/negative/view/weekly' }
];

const UserProfile = ({ isExpanded, navigate }: { isExpanded: boolean; navigate: (path: string) => void }) => {
  const { user } = useAuth();

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const avatarSize = isExpanded ? "w-10 h-10" : "w-8 h-8";
  const textSize = isExpanded ? "text-sm" : "text-xs";

  const profileContent = (
    <div className="flex items-center space-x-3 w-full">
      <div className="relative flex-shrink-0">
        <div className={`${avatarSize} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${textSize} border-2 border-white/20`}>
          {getUserInitials(user?.email)}
        </div>
      </div>
      {isExpanded && (
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-700 truncate">
            {user?.email?.split('@')[0] || 'Usuario'}
          </span>
          <span className="text-xs text-gray-500 truncate">
            {user?.email}
          </span>
        </div>
      )}
    </div>
  );

  if (!isExpanded) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-auto p-1.5 hover:bg-white/20 rounded-xl transition-colors duration-150 flex items-center justify-center"
              onClick={() => navigate('/settings')}
            >
              {profileContent}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black text-white border-gray-700">
            <p>Perfil y configuracion</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full h-auto p-4 hover:bg-white/20 rounded-xl transition-colors duration-150 flex items-center justify-start"
      onClick={() => navigate('/settings')}
    >
      {profileContent}
    </Button>
  );
};

const DesktopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('desktop-nav-expanded');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('desktop-nav-expanded', JSON.stringify(isExpanded));
    document.documentElement.style.setProperty(
      '--desktop-nav-width',
      isExpanded ? '256px' : '64px'
    );
  }, [isExpanded]);

  const DesktopMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem) => {
    const basePath = path.includes('/view/') ? path.split('/view/')[0] : path;
    const isActive = basePath === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(basePath);

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

      {/* User Profile Section - Top */}
      <div className={`border-b border-white/20 ${isExpanded ? 'p-4' : 'p-1.5'}`}>
        <UserProfile isExpanded={isExpanded} navigate={navigate} />
      </div>

      {/* Main Navigation - Middle */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <DesktopMenuItem key={item.path} icon={item.icon} label={item.label} path={item.path} />
          ))}
        </div>
      </nav>

      {/* Bottom Section - Expand/Collapse */}
      <div className="p-3 border-t border-white/20">
        <Button
          variant="ghost"
          size="icon"
          title="Expand/Collapse Menu"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 hover:bg-white/20 rounded-lg"
        >
          <ChevronRight className={`w-4 h-4 transform transition-transform duration-200
            ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    </aside>
  );
};

export default DesktopNavigation;
