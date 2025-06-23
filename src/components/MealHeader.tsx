import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, ChefHat, ShoppingCart, Utensils, Package, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  shortLabel: string;
}

const navigationItems: NavigationItem[] = [
  {
    path: '/meal',
    label: 'Plan de Comidas',
    shortLabel: 'Plan',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    path: '/shopping-list',
    label: 'Lista de Compras',
    shortLabel: 'Lista',
    icon: <ShoppingCart className="h-4 w-4" />
  },
  {
    path: '/recipes',
    label: 'Recetas',
    shortLabel: 'Recetas',
    icon: <ChefHat className="h-4 w-4" />
  },
  {
    path: '/prepared-meals',
    label: 'Comidas Preparadas',
    shortLabel: 'Preparadas',
    icon: <Package className="h-4 w-4" />
  }
];

interface MealHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  sticky?: boolean;
}

export const MealHeader: React.FC<MealHeaderProps> = ({
  title,
  subtitle = 'Gestiona tu alimentación',
  children,
  sticky = true
}) => {
  const location = useLocation();

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100',
        sticky && 'sticky top-0 z-10 shadow-sm'
      )}
    >
      <div className="p-4 sm:p-6">
        {/* Título principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Utensils className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{subtitle}</p>
            </div>
          </div>
          
          {/* Acciones adicionales */}
          {children && (
            <div className="hidden sm:flex items-center space-x-3 flex-wrap lg:flex-nowrap">
              {children}
            </div>
          )}
        </div>

        {/* Navegación horizontal - Desktop */}
        <nav className="hidden sm:flex gap-2 lg:gap-4">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  "hover:bg-white/90 hover:shadow-lg hover:scale-105 transform",
                  isActive
                    ? "bg-white text-blue-700 shadow-lg border border-blue-200 scale-105"
                    : "text-gray-700 hover:text-gray-900"
                )}
              >
                <span className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                )}>
                  {item.icon}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Navegación móvil - Dropdown */}
        <div className="sm:hidden flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 justify-between bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <Menu className="h-4 w-4" />
                  <span>Navegación</span>
                </div>
                <span className="text-xs text-gray-500">
                  {navigationItems.find(item => item.path === location.pathname)?.shortLabel || 'Seleccionar'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center space-x-3 w-full px-3 py-2 rounded-lg cursor-pointer",
                        isActive && "bg-blue-50 text-blue-700"
                      )}
                    >
                      <span className={cn(
                        "p-1.5 rounded-md",
                        isActive 
                          ? "bg-blue-100 text-blue-600" 
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Acciones adicionales en móvil */}
          {children && (
            <div className="flex items-center space-x-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealHeader;
