import React from 'react';
import { List, Columns, Calendar, BarChart, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface NavigationItem {
  tab: string;
  label: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    tab: 'list',
    label: 'Lista',
    icon: <List className="h-4 w-4" />
  },
  {
    tab: 'kanban',
    label: 'Kanban',
    icon: <Columns className="h-4 w-4" />
  },
  {
    tab: 'week',
    label: 'Calendario',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    tab: 'analytics',
    label: 'Análisis',
    icon: <BarChart className="h-4 w-4" />
  }
];

interface TaskAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  dropdown?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

interface CompactTaskHeaderProps {
  title: string;
  actions?: TaskAction[];
  className?: string;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const CompactTaskHeader: React.FC<CompactTaskHeaderProps> = ({
  title,
  actions = [],
  className,
  currentTab = 'list',
  onTabChange
}) => {

  return (
    <div className={cn("", className)}>
      <div className="container mx-auto">
        <div className="bg-background/50 flex items-center justify-between gap-2 py-4 backdrop-blur-md lg:mt-4 lg:rounded-2xl lg:border lg:px-4">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
              </div>
              
              {/* Navigation - Desktop */}
              <nav className="hidden md:flex gap-2 lg:gap-4">
                {navigationItems.map((item) => {
                  const isActive = currentTab === item.tab;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => onTabChange?.(item.tab)}
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
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
          
          {/* Action buttons */}
          {actions.length > 0 && (
            <>
              {/* Desktop: Icon buttons */}
              <TooltipProvider>
                <div className="hidden md:flex items-center gap-2">
                  {actions.map((action) => (
                    action.dropdown ? (
                      <DropdownMenu key={action.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                {action.icon}
                                <span className="sr-only">{action.label}</span>
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{action.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                          {action.dropdown.map((item, index) => (
                            <DropdownMenuItem key={index} onClick={item.onClick}>
                              {item.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Tooltip key={action.id}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={action.onClick}>
                            {action.icon}
                            <span className="sr-only">{action.label}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{action.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  ))}
                </div>
              </TooltipProvider>

              {/* Mobile: Three dots menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 md:hidden">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Opciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action) => (
                    action.dropdown ? (
                      <DropdownMenuSub key={action.id}>
                        <DropdownMenuSubTrigger>
                          {action.icon}
                          <span className="ml-2">{action.label}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {action.dropdown.map((item, index) => (
                            <DropdownMenuItem key={index} onClick={item.onClick}>
                              {item.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ) : (
                      <DropdownMenuItem key={action.id} onClick={action.onClick}>
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </DropdownMenuItem>
                    )
                  ))}
                  <DropdownMenuSeparator />
                  {navigationItems.filter(item => item.tab !== currentTab).map((item) => (
                    <DropdownMenuItem key={item.tab} onClick={() => onTabChange?.(item.tab)}>
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactTaskHeader;