import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, TrendingUp, Droplets, Smile, CheckCircle, ListTodo } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { menuItems } from './DesktopNavigation';
import type { MenuItem } from './types';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setIsMenuOpen(false); // Close sheet before navigating
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  const visibleMenuItems = menuItems.slice(0, 4);
  const expandedMenuItems = menuItems.slice(4);

  // Quick access shortcuts for widgets
  const quickAccessItems = [
    { icon: Droplets, label: 'Agua +250ml', path: '/water', action: 'quick-water' },
    { icon: Smile, label: 'Registrar Ánimo', path: '/mood', action: 'quick-mood' },
    { icon: CheckCircle, label: 'Marcar Hábito', path: '/habit', action: 'quick-habit' },
    { icon: ListTodo, label: 'Nueva Tarea', path: '/task', action: 'quick-task' },
    { icon: TrendingUp, label: 'Resumen Hoy', path: '/stats', action: 'quick-stats' },
  ];
    const MobileMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem & { onClick?: () => void }) => {
    const isActive = location.pathname === path;
    
    return (
      <Button
        variant="ghost"
        className={`flex flex-col items-center justify-center h-auto px-2 py-2 text-xs rounded-xl transition-all duration-300 active:scale-95 touch-manipulation
          ${isActive 
            ? 'text-blue-600 bg-blue-50 shadow-sm scale-105' 
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 hover:scale-105'
          }`}
        onClick={() => {
          if (onClick) {
            onClick();
          } else {
            navigate(path);
          }
          setIsMenuOpen(false);
        }}
      >
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'animate-pulse' : ''}`} />
        <span className="mt-1 font-medium leading-tight">{label}</span>
      </Button>
    );
  };  return (
    <div className="md:hidden">
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 shadow-lg">
        <nav className="flex justify-around items-center px-1 py-1 max-w-screen-sm mx-auto">
          {visibleMenuItems.map((item) => (
            <MobileMenuItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
            />
          ))}
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center h-auto px-2 py-2 text-xs rounded-xl transition-all duration-300 active:scale-95 touch-manipulation
                  ${isMenuOpen ? 'text-blue-600 bg-blue-50 scale-105' : 'text-gray-600 hover:bg-blue-50/50 hover:scale-105'}`}
              >
                <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 transform transition-transform duration-300
                  ${isMenuOpen ? 'rotate-180' : ''}`} />
                <span className="mt-1 font-medium leading-tight">Más</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="bottom" className="rounded-t-2xl bg-white/95 backdrop-blur-md border-t border-gray-200 max-w-screen-sm mx-auto">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-center text-lg font-semibold text-gray-800">Más opciones</SheetTitle>
              </SheetHeader>
              
              {/* Quick Access Section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-3 px-2">Acceso Rápido</h3>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {quickAccessItems.map((item) => (
                    <Button
                      key={item.action}
                      variant="outline"
                      className="flex items-center gap-2 h-auto p-3 text-left justify-start bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                      onClick={() => {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }}
                    >
                      <item.icon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Regular Menu Items */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3 px-2">Todas las Opciones</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-2">
                  {expandedMenuItems.map((item) => (
                    <MobileMenuItem
                      key={item.path}
                      icon={item.icon}
                      label={item.label}
                      path={item.path}
                      onClick={item.path === '/logout' ? handleLogout : undefined}
                    />
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </div>
  );
};

export default MobileNavigation;