import React, { memo, useCallback } from 'react';
import { isBefore, startOfDay, format, addDays } from 'date-fns';
import { Repeat, Calendar, Edit, Tag, Play, Clock, Target, Eye } from 'lucide-react';
import { Task, TimeOfDay, CATEGORY_LABELS } from '../models';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
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
} from '@/shared/components/ui/alert-dialog';
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
  onMove?: (taskId: string, startDate: Date | null) => void;
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

// Compact TaskActions for table view
const CompactTaskActions = memo<{
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
  onAssignTimeOfDay?: (taskId: string, timeOfDay: TimeOfDay) => void;
}>(({ task, onEdit, onDelete, onView }) => {
  const navigate = useNavigate();
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  }, [onEdit, task]);

  const handleView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(task);
  }, [onView, task]);

  const handleRun = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/task/${task.id}/run`);
  }, [navigate, task.taskCode]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRun}
        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        title="Ejecutar tarea"
      >
        <Play className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        title="Editar tarea"
      >
        <Edit className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleView}
        className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
        title="Ver detalles"
      >
        <Eye className="h-3 w-3" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-gray-50"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-red-600 focus:text-red-600"
              >
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
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
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

CompactTaskActions.displayName = 'CompactTaskActions';

// Main component with hybrid table/card design
export const TaskItemList = memo<TaskItemListProps>(({
  task,
  onDelete,
  onEdit,
  onView,
  onMove,
  onAssignTimeOfDay,
  showCategoryLabel = true
}) => {
  const navigate = useNavigate();
  const overdue = isTaskOverdue(task.startDate ?? null);
  const pInfo = getPriorityInfo(task.priority);

  const handleCardClick = useCallback(() => {
    onView?.(task);
  }, [onView, task]);

  const getStatusVariant = () => {
    if (task.completed) return 'default';
    if (overdue) return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (task.completed) return <Target className="h-3 w-3" />;
    if (overdue) return <Clock className="h-3 w-3" />;
    return <Calendar className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (task.completed) return 'Completada';
    if (overdue) return 'Vencida';
    if (task.startDate) {
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      
      if (isBefore(task.startDate, startOfDay(addDays(today, 1)))) {
        return 'Hoy';
      } else if (isBefore(task.startDate, startOfDay(addDays(tomorrow, 1)))) {
        return 'Mañana';
      }
    }
    return 'Pendiente';
  };

  return (
    <div className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleCardClick}>
      {/* Mobile Layout - Card */}
      <div className="md:hidden">
        <Card className={cn(
          'border border-gray-200 bg-white m-2',
          task.completed && 'opacity-75',
          !task.completed && overdue && 'border-l-4 border-l-red-500 bg-red-50/30'
        )}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {showCategoryLabel && (
                    <div className="flex-shrink-0 mt-1">
                      <Tag className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        'text-sm font-medium text-gray-900 flex-1',
                        task.completed && 'line-through text-gray-500'
                      )}>
                        {task.title}
                      </h3>
                      <span className="text-xs font-mono text-gray-400">#{task.taskCode}</span>
                    </div>
                    {task.description && (
                      <p className={cn(
                        'text-xs text-gray-500 mt-1 line-clamp-2',
                        task.completed && 'line-through'
                      )}>
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant()} className="text-xs">
                    <div className="flex items-center gap-1">
                      {getStatusIcon()}
                      <span>{getStatusText()}</span>
                    </div>
                  </Badge>
                  {task.isPrivate && (
                    <Badge variant="outline" className="text-xs">
                      🔒
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {showCategoryLabel && (
                    <span>{CATEGORY_LABELS[task.category]}</span>
                  )}
                  {task.estimatedTime && (
                    <>
                      <span>•</span>
                      <span>{task.estimatedTime}m</span>
                    </>
                  )}
                  {task.startDate && (
                    <>
                      <span>•</span>
                      <span>{formatDateToSpanish(task.startDate)}</span>
                    </>
                  )}
                  {pInfo.label && (
                    <>
                      <span>•</span>
                      <span>{pInfo.label}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/task/${task.id}/run`);
                    }}
                    className="h-6 w-6 p-0 text-green-600"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="h-6 w-6 p-0 text-blue-600"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Layout - Table Row */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100">
        {/* Tarea Column */}
        <div className="col-span-4">
          <div className="flex items-start gap-3">
            {showCategoryLabel && (
              <div className="flex-shrink-0 mt-1">
                <Tag className="h-4 w-4 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  'text-sm font-medium text-gray-900 flex-1',
                  task.completed && 'line-through text-gray-500'
                )}>
                  {task.title}
                </h3>
                <span className="text-xs font-mono text-gray-400">#{task.taskCode}</span>
              </div>
              {task.description && (
                <p className={cn(
                  'text-xs text-gray-500 mt-1 line-clamp-1',
                  task.completed && 'line-through'
                )}>
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {showCategoryLabel && (
                  <span className="text-xs text-gray-500">
                    {CATEGORY_LABELS[task.category]}
                  </span>
                )}
                {task.isPrivate && (
                  <Badge variant="outline" className="text-xs">
                    🔒 Privada
                  </Badge>
                )}
                {task.isRecurrent && (
                  <Badge variant="outline" className="text-xs">
                    <Repeat className="w-3 h-3 mr-1" />
                    {getRecurrenceDescription(task.recurrence)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estado Column */}
        <div className="col-span-2 flex justify-center items-center">
          <Badge variant={getStatusVariant()} className="text-xs">
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </Badge>
        </div>

        {/* Prioridad Column */}
        <div className="col-span-1 flex justify-center items-center">
          {pInfo.label ? (
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: pInfo.color + '20', color: pInfo.color }}>
              {pInfo.label}
            </Badge>
          ) : (
            <span className="text-xs text-gray-400">Sin prioridad</span>
          )}
        </div>

        {/* Tiempo Column */}
        <div className="col-span-1 flex justify-center items-center">
          {task.estimatedTime ? (
            <span className="text-xs text-gray-600">
              {task.estimatedTime}m
            </span>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </div>

        {/* Fecha Column */}
        <div className="col-span-2 flex justify-center items-center">
          {task.startDate ? (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>{formatDateToSpanish(task.startDate)}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Sin fecha</span>
          )}
        </div>

        {/* Acciones Column */}
        <div className="col-span-2 flex justify-center items-center">
          <CompactTaskActions
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onMove={onMove}
            onAssignTimeOfDay={onAssignTimeOfDay}
          />
        </div>
      </div>
    </div>
  );
});

TaskItemList.displayName = 'TaskItemList';
