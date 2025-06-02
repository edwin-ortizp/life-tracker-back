import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
  
  const MobileMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem & { onClick?: () => void }) => {
    const isActive = location.pathname === path;
    
    return (
      <Button
        variant="ghost"
        className={`flex flex-col items-center justify-center h-auto px-3 py-2 text-xs rounded-xl transition-all duration-200
          ${isActive 
            ? 'text-blue-600 bg-blue-50 shadow-sm' 
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
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
        <Icon className={`w-6 h-6 ${isActive ? 'animate-bounce-gentle' : ''}`} />
        <span className="mt-1 font-medium">{label}</span>
      </Button>
    );
  };
  return (
    <div className="md:hidden">      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-30 shadow-sm">
        <div className="flex justify-between items-center px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">DT</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Daily Tracker
            </h1>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-20 shadow-lg">
        <nav className="flex justify-around items-center px-2 py-2 safe-area-padding-bottom">
          {visibleMenuItems.map((item) => (
            <MobileMenuItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
            />
          ))}          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center h-auto px-3 py-2 text-xs rounded-xl transition-all duration-200
                  ${isMenuOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-blue-50/50'}`}
              >
                <ChevronDown className={`w-6 h-6 transform transition-transform duration-300
                  ${isMenuOpen ? 'rotate-180' : ''}`} />
                <span className="mt-1 font-medium">Más</span>
              </Button>
            </SheetTrigger><SheetContent side="bottom" className="rounded-t-2xl bg-white/95 backdrop-blur-md border-t border-gray-200">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-center text-lg font-semibold text-gray-800">Más opciones</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-3 p-2">
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
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </div>
  );
};

export default MobileNavigation;