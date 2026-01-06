import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, ChefHat, ShoppingCart, Utensils, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    path: '/meal',
    label: 'Plan de Comidas',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    path: '/shopping-list/list',
    label: 'Lista de Compras',
    icon: <ShoppingCart className="h-4 w-4" />
  },
  {
    path: '/recipes',
    label: 'Recetas',
    icon: <ChefHat className="h-4 w-4" />
  },
  {
    path: '/prepared-meals',
    label: 'Comidas Preparadas',
    icon: <Package className="h-4 w-4" />
  }
];

interface CompactMealHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export const CompactMealHeader: React.FC<CompactMealHeaderProps> = ({
  title,
  children,
  className
}) => {
  const location = useLocation();

  return (
    <div className={cn("", className)}>
      <div className="container mx-auto">
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
                  const isActive = item.path === '/shopping-list/list'
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
          
          {children && (
            <div className="flex items-center gap-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactMealHeader;
