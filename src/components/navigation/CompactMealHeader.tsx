import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, ChefHat, ShoppingCart, Utensils, Package, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    path: '/meal/view/weekly',
    label: 'Plan de Comidas',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    path: '/shopping-list/view/list',
    label: 'Lista de Compras',
    icon: <ShoppingCart className="h-4 w-4" />
  },
  {
    path: '/recipes/view/list',
    label: 'Recetas',
    icon: <ChefHat className="h-4 w-4" />
  },
  {
    path: '/prepared-meals/view/list',
    label: 'Comidas Preparadas',
    icon: <Package className="h-4 w-4" />
  }
];

interface CompactMealHeaderProps {
  title: string;
  views?: Array<{ key: string; label: string }>;
  activeViewKey?: string;
  onViewChange?: (viewKey: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export const CompactMealHeader: React.FC<CompactMealHeaderProps> = ({
  title,
  views,
  activeViewKey,
  onViewChange,
  children,
  className
}) => {
  const location = useLocation();
  const activeViewLabel = views?.find((view) => view.key === activeViewKey)?.label;

  return (
    <div className={cn("", className)}>
      <div className="w-full px-6">
        <div className="bg-background/50 flex items-center justify-between gap-2 py-4 backdrop-blur-md lg:mt-4 lg:rounded-2xl lg:border lg:px-4">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                  <Utensils className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
              </div>

              {/* Navigation - Desktop */}
              <nav className="hidden md:flex gap-2 lg:gap-4">
                {navigationItems.map((item) => {
                  const isActive = item.path.includes('/shopping-list/')
                    ? location.pathname.startsWith('/shopping-list')
                    : location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                        "hover:bg-white/90 hover:shadow-lg",
                        isActive
                          ? "bg-white text-blue-700 shadow-lg border border-blue-200"
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
            </div>
          </div>

          <div className="flex items-center gap-3">
            {views && onViewChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span>{activeViewLabel ?? 'Vistas'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {views.map((view) => (
                    <DropdownMenuItem
                      key={view.key}
                      onClick={() => onViewChange(view.key)}
                      className={cn(activeViewKey === view.key && 'bg-accent font-medium')}
                    >
                      {view.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {children && (
              <div className="flex items-center gap-3">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactMealHeader;
