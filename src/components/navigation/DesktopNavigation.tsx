import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  Dumbbell,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MenuItem } from './types';
import { ClipboardList, ThumbsDown, Kanban as KanbanIcon, BarChart } from 'lucide-react';

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
  { icon: BarChart, label: 'Estadísticas', path: '/stats' },
  { icon: ThumbsDown, label: 'Hábitos Negativos', path: '/negative' }
];

const UserProfile = ({ isExpanded, navigate }: { isExpanded: boolean; navigate: (path: string) => void }) => {
  const { user } = useAuth();
  
  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const profileContent = (
    <div className="flex items-center space-x-3">
      <div className="relative">
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-white/20"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white/20 ${user?.photoURL ? 'hidden' : ''}`}>
          {getUserInitials(user?.displayName || user?.email)}
        </div>
      </div>
      {isExpanded && (
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-700 truncate">
            {user?.displayName || 'Usuario'}
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
              className="w-full p-3 hover:bg-white/20 rounded-xl transition-colors duration-150"
              onClick={() => navigate('/settings')}
            >
              {profileContent}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black text-white border-gray-700">
            <p>Perfil y configuración</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full p-4 hover:bg-white/20 rounded-xl transition-colors duration-150"
      onClick={() => navigate('/settings')}
    >
      {profileContent}
    </Button>
  );
};

const DesktopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isExpanded, setIsExpanded] = useState(() => {
    // Recordar el estado de la navegación en desktop
    const saved = localStorage.getItem('desktop-nav-expanded');
    return saved === 'true';
  });

  // Persistir el estado de expansión
  useEffect(() => {
    localStorage.setItem('desktop-nav-expanded', JSON.stringify(isExpanded));
    // Actualizar la variable CSS para el margin del contenido
    document.documentElement.style.setProperty(
      '--desktop-nav-width', 
      isExpanded ? '256px' : '64px'
    );
  }, [isExpanded]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };const DesktopMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem) => {
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
      
      {/* User Profile Section - Top */}
      <div className="p-4 border-b border-white/20">
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
      
      {/* Bottom Section - Expand/Collapse + Logout */}
      <div className="p-3 border-t border-white/20 space-y-2">
        {/* Expand/Collapse Button */}
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
        
        {/* Logout Button */}
        <DesktopMenuItem 
          icon={LogOut} 
          label="Salir" 
          path="/logout" 
          onClick={handleLogout} 
        />
      </div>
    </aside>
  );
};

export default DesktopNavigation;