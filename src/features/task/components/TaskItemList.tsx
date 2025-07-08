import React, { memo, useCallback } from 'react';
import { isBefore, startOfDay, format, addDays } from 'date-fns';
import { toNoon } from '@/utils/dates';
import { Repeat, Calendar, Edit, Tag, Play } from 'lucide-react';
import { Task, TimeOfDay, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal } from 'lucide-react';

// Constants
const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
} as const;

const PRIORITY_CONFIG = {
  do: { label: 'HACER', color: 'bg-red-500', text: 'Urgente e importante' },
  decide: { label: 'DECIDIR', color: 'bg-orange-500', text: 'Importante, no urgente' },
  delegate: { label: 'DELEGAR', color: 'bg-blue-500', text: 'Urgente, no importante' },
  delete: { label: 'ELIMINAR', color: 'bg-gray-500', text: 'Ni urgente ni importante' },
  none: { label: '', color: '', text: '' }
} as const;

// Types
type Priority = keyof typeof PRIORITY_CONFIG;
type RecurrenceType = keyof typeof RECURRENCE_LABELS;

interface TaskItemListProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  onAssignTimeOfDay?: (taskId: string, timeOfDay: TimeOfDay) => void;
  showCategoryLabel?: boolean;
}

// Utility functions
const formatDateToSpanish = (date: Date): string => format(date, 'dd/MM');

const getRecurrenceDescription = (recurrence: any): string => {
  if (!recurrence?.type) return '';
  return RECURRENCE_LABELS[recurrence.type as RecurrenceType] || '';
};

const getPriorityInfo = (priority: string = 'none') => {
  return PRIORITY_CONFIG[priority as Priority] || PRIORITY_CONFIG.none;
};

const isTaskOverdue = (dueDate: Date | null): boolean => {
  return dueDate ? isBefore(startOfDay(dueDate), startOfDay(new Date())) : false;
};

// Category icon component inspired by Metronic design
const CategoryIcon = memo<{ category: string }>(({ category }) => {
  const categoryStyle = {
    bg: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]?.bg || 'bg-purple-100',
    text: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]?.text || 'text-purple-800'
  };

  return (
    <div className={cn(
      'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
      categoryStyle.bg
    )}>
      <Tag className={cn('w-6 h-6', categoryStyle.text)} />
    </div>
  );
});

CategoryIcon.displayName = 'CategoryIcon';

// Status badge component
const TaskStatus = memo<{ task: Task; overdue: boolean }>(({ task, overdue }) => {
  if (task.completed) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Completada
      </Badge>
    );
  }
  
  if (overdue) {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        Vencida
      </Badge>
    );
  }

  if (task.dueDate) {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    
    if (isBefore(task.dueDate, startOfDay(addDays(today, 1)))) {
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          Hoy
        </Badge>
      );
    } else if (isBefore(task.dueDate, startOfDay(addDays(tomorrow, 1)))) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Mañana
        </Badge>
      );
    }
  }

  return (
    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
      Pendiente
    </Badge>
  );
});

TaskStatus.displayName = 'TaskStatus';

// Metrics component inspired by Metronic
const TaskMetrics = memo<{ task: Task }>(({ task }) => {
  const pInfo = getPriorityInfo(task.priority);
  
  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      {task.estimatedTime && (
        <div className="flex items-center gap-1">
          <span className="text-xs">⏱️</span>
          <span>{task.estimatedTime}m estimado</span>
        </div>
      )}
      {pInfo.label && (
        <div className="flex items-center gap-1">
          <span className="text-xs">🎯</span>
          <span>Prioridad: {pInfo.label}</span>
        </div>
      )}
      {task.dueDate && (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Vence: {formatDateToSpanish(task.dueDate)}</span>
        </div>
      )}
    </div>
  );
});

TaskMetrics.displayName = 'TaskMetrics';

// List-specific TaskActions with improved design
const TaskListActions = memo<{
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  onAssignTimeOfDay?: (taskId: string, timeOfDay: TimeOfDay) => void;
}>(({ task, onEdit, onDelete, onMove, onAssignTimeOfDay }) => {
  const navigate = useNavigate();
  
  const handleSetToday = useCallback(() => {
    onMove?.(task.id, toNoon(new Date()));
  }, [onMove, task.id]);

  const handleSetTomorrow = useCallback(() => {
    onMove?.(task.id, toNoon(addDays(new Date(), 1)));
  }, [onMove, task.id]);

  const handleRemoveDate = useCallback(() => {
    onMove?.(task.id, null);
  }, [onMove, task.id]);

  const handleAssignMorning = useCallback(() => {
    onAssignTimeOfDay?.(task.id, 'morning');
  }, [onAssignTimeOfDay, task.id]);

  const handleAssignAfternoon = useCallback(() => {
    onAssignTimeOfDay?.(task.id, 'afternoon');
  }, [onAssignTimeOfDay, task.id]);

  const handleAssignEvening = useCallback(() => {
    onAssignTimeOfDay?.(task.id, 'evening');
  }, [onAssignTimeOfDay, task.id]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  }, [onEdit, task]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);

  const handleRun = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/task/${task.id}/run`);
  }, [navigate, task.id]);

  return (
    <div className="flex items-center gap-2">
      {/* Primary Actions - Visible */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-xs font-medium hover:bg-green-50 hover:text-green-700"
        onClick={handleRun}
      >
        <Play className="w-3 h-3 mr-1" />
        Ejecutar
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-xs font-medium hover:bg-blue-50 hover:text-blue-700"
        onClick={handleEdit}
      >
        <Edit className="w-3 h-3 mr-1" />
        Editar
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-50"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Date Actions */}
          {onMove && (
            <>
              <DropdownMenuItem onClick={handleSetToday} className="text-sm">
                <span className="mr-2">📅</span>
                Asignar para hoy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSetTomorrow} className="text-sm">
                <span className="mr-2">🌅</span>
                Asignar para mañana
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRemoveDate} className="text-sm">
                <span className="mr-2">❌</span>
                Quitar fecha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Time of Day Actions */}
          {onAssignTimeOfDay && (
            <>
              <DropdownMenuItem onClick={handleAssignMorning} className="text-sm">
                <span className="mr-2">🌅</span>
                Asignar a mañana
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAssignAfternoon} className="text-sm">
                <span className="mr-2">🏙️</span>
                Asignar a tarde
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAssignEvening} className="text-sm">
                <span className="mr-2">🌙</span>
                Asignar a noche
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Delete Action */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-sm text-red-600 focus:text-red-600">
                <span className="mr-2">🗑️</span>
                Eliminar tarea
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La tarea "{task.title}" será eliminada permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

TaskListActions.displayName = 'TaskListActions';

// Main component with Metronic-inspired design
export const TaskItemList = memo<TaskItemListProps>(({
  task,
  onDelete,
  onEdit,
  onView,
  onMove,
  onAssignTimeOfDay,
  showCategoryLabel = true
}) => {
  const overdue = isTaskOverdue(task.dueDate ?? null);

  const handleCardClick = useCallback(() => {
    onView?.(task);
  }, [onView, task]);

  const cardClassName = cn(
    'cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-200 bg-white',
    task.completed && 'opacity-75',
    !task.completed && overdue && 'border-l-4 border-l-red-500 bg-red-50/30'
  );

  return (
    <Card onClick={handleCardClick} className={cardClassName}>
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* Category Icon - Left side like Metronic brand logos */}
          {showCategoryLabel && (
            <CategoryIcon category={task.category} />
          )}
          
          {/* Main Content - Center */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {task.isPrivate && (
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                      🔒 Privada
                    </span>
                  )}
                  <TaskStatus task={task} overdue={overdue} />
                </div>
                
                <h3 className={cn(
                  'text-lg font-semibold text-gray-900 mb-1 leading-tight',
                  task.completed && 'line-through text-gray-500'
                )}>
                  {task.title}
                </h3>
                
                {task.description && (
                  <p className={cn(
                    'text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed',
                    task.completed && 'line-through'
                  )}>
                    {task.description}
                  </p>
                )}
                
                <TaskMetrics task={task} />
              </div>
              
              {/* Actions - Right side */}
              <TaskListActions
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                onAssignTimeOfDay={onAssignTimeOfDay}
              />
            </div>
            
            {/* Additional badges at bottom */}
            <div className="flex flex-wrap gap-2 mt-4">
              {!showCategoryLabel && (
                <Badge variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {CATEGORY_LABELS[task.category]}
                </Badge>
              )}
              
              {task.isRecurrent && (
                <Badge variant="outline" className="text-xs">
                  <Repeat className="w-3 h-3 mr-1" />
                  {getRecurrenceDescription(task.recurrence)}
                </Badge>
              )}
              
              {task.size && (
                <Badge variant="secondary" className="text-xs">
                  Tamaño: {task.size}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TaskItemList.displayName = 'TaskItemList';