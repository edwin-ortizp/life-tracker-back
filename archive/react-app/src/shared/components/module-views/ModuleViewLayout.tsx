import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/shared/hooks/useResponsive';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ChevronDown, MoreVertical } from 'lucide-react';
import type { ModuleViewAction, ModuleViewDefinition } from './types';

interface ModuleViewLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  views?: Array<ModuleViewDefinition<any>>;
  activeViewKey?: string;
  onViewChange?: (viewKey: string) => void;
  actions?: ModuleViewAction[];
  className?: string;
  children: React.ReactNode;
}

const ModuleViewLayout: React.FC<ModuleViewLayoutProps> = ({
  title,
  subtitle,
  icon,
  views,
  activeViewKey,
  onViewChange,
  actions = [],
  className,
  children,
}) => {
  const { shouldShowDesktopNav } = useResponsive();
  const containerClass = shouldShowDesktopNav ? 'w-full px-6' : 'w-full px-4';
  const activeView = views?.find((view) => view.key === activeViewKey);

  return (
    <div className={cn('min-h-screen relative', className)}>
      <div className={containerClass}>
        <div className="bg-background/50 flex flex-col gap-4 py-4 backdrop-blur-md lg:mt-4 lg:rounded-2xl lg:border lg:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {views && onViewChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span>{activeView?.label ?? 'Vistas'}</span>
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

            {actions.length > 0 && (
              <>
                <TooltipProvider>
                  <div className="hidden lg:flex items-center gap-2">
                    {actions.map((action) => (
                      action.dropdown ? (
                        <DropdownMenu key={action.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    action.showLabel ? 'h-8 px-3 gap-2' : 'h-8 w-8 p-0',
                                    action.className
                                  )}
                                >
                                  {action.icon}
                                  {action.showLabel ? (
                                    <span className="text-sm font-medium">{action.label}</span>
                                  ) : (
                                    <span className="sr-only">{action.label}</span>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            {action.tooltip && (
                              <TooltipContent>
                                <p>{action.tooltip}</p>
                              </TooltipContent>
                            )}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                action.showLabel ? 'h-8 px-3 gap-2' : 'h-8 w-8 p-0',
                                action.className
                              )}
                              onClick={action.onClick}
                            >
                              {action.icon}
                              {action.showLabel ? (
                                <span className="text-sm font-medium">{action.label}</span>
                              ) : (
                                <span className="sr-only">{action.label}</span>
                              )}
                            </Button>
                          </TooltipTrigger>
                          {action.tooltip && (
                            <TooltipContent>
                              <p>{action.tooltip}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      )
                    ))}
                  </div>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 lg:hidden">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Opciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={cn(containerClass, 'pb-4')}>
        {children}
      </div>
    </div>
  );
};

export default ModuleViewLayout;
