import React from 'react';
import { ModernCard } from '@/components/ui/modern-card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DailyWidgetProps {
  title: string;
  icon: LucideIcon;
  variant?: 'compact' | 'detailed' | 'chart';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  error?: string;
}

export const DailyWidget: React.FC<DailyWidgetProps> = ({
  title,
  icon: Icon,
  variant = 'compact',
  children,
  className,
  onClick,
  loading = false,
  error
}) => {
  const baseClasses = cn(
    'transition-all duration-200',
    onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
    className
  );

  const headerClasses = cn(
    'flex items-center gap-2 mb-2',
    variant === 'compact' && 'mb-1'
  );

  const contentClasses = cn(
    'space-y-2',
    variant === 'compact' && 'space-y-1',
    variant === 'chart' && 'space-y-3'
  );

  const sizeClasses = {
    compact: 'p-3',
    detailed: 'p-4',
    chart: 'p-4'
  };

  return (
    <ModernCard
      className={baseClasses}
      variant="default"
      onClick={onClick}
    >
      <div className={sizeClasses[variant]}>
        <div className={headerClasses}>
          <Icon className={cn(
            'text-blue-600',
            variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'
          )} />
          <h3 className={cn(
            'font-medium text-gray-800',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}>
            {title}
          </h3>
        </div>
        
        {loading && (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-sm">
            Error: {error}
          </div>
        )}
        
        {!loading && !error && (
          <div className={contentClasses}>
            {children}
          </div>
        )}
      </div>
    </ModernCard>
  );
};

export default DailyWidget;