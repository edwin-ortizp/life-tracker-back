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

  const MobileMenuItem = ({ icon: Icon, label, path, onClick }: MenuItem & { onClick?: () => void }) => (
    <Button
      variant="ghost"
      className={`flex flex-col items-center justify-center h-auto px-2 py-1 text-xs
        ${location.pathname === path ? 'text-primary' : 'text-muted-foreground'}`}
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          navigate(path);
        }
        setIsMenuOpen(false);
      }}
    >
      <Icon className="w-7 h-7" /> {/* Adjusted icon size slightly for balance */}
      <span className="mt-1">{label}</span>
    </Button>
  );

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-indigo-600 border-b z-30">
        <div className="flex justify-between items-center px-4 h-14">
          <h1 className="text-xl font-bold text-white">Daily Tracker</h1>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20"> {/* Lower z-index than sheet */}
        <nav className="flex justify-around items-center px-2 py-1"> {/* Changed to justify-around */}
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
                className={`flex flex-col items-center justify-center h-auto px-2 py-1 text-xs
                  ${isMenuOpen ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <ChevronDown className={`w-7 h-7 transform transition-transform duration-300
                  ${isMenuOpen ? 'rotate-180' : ''}`} />
                <span className="mt-1">Más</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-lg">
              <SheetHeader className="mb-2">
                <SheetTitle className="text-center">Más opciones</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-2 p-2">
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