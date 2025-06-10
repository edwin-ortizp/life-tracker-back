import React from 'react';
import { isBefore, startOfDay, format, addDays } from 'date-fns';
import { toNoon } from '@/utils/dates';
import { CheckCircle2, Circle, X, Repeat, Calendar, Edit, Tag, AlignLeft } from 'lucide-react';
import { Task, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
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

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  variant?: 'list' | 'kanban';
  showCategoryLabel?: boolean; // Nueva prop para controlar si mostrar la etiqueta de categoría
}

// Utilidad para formatear fechas en español
const formatDateToSpanish = (date: Date): string => {
  return format(date, 'dd/MM');
};

// Utilidad para obtener descripción de recurrencia
const getRecurrenceDescription = (recurrence: any): string => {
  if (!recurrence) return '';
  
  switch (recurrence.type) {
    case 'daily':
      return 'Diario';
    case 'weekly':
      return 'Semanal';
    case 'monthly':
      return 'Mensual';
    default:
      return '';
  }
};

// Utilidad para obtener información de prioridad
const getPriorityInfo = (priority: string) => {
  const priorityMap = {
    do: { label: 'HACER', color: 'bg-red-500', text: 'Urgente e importante' },
    decide: { label: 'DECIDIR', color: 'bg-orange-500', text: 'Importante, no urgente' },
    delegate: { label: 'DELEGAR', color: 'bg-blue-500', text: 'Urgente, no importante' },
    delete: { label: 'ELIMINAR', color: 'bg-gray-500', text: 'Ni urgente ni importante' },
    none: { label: '', color: '', text: '' }
  };
  
  return priorityMap[priority as keyof typeof priorityMap] || priorityMap.none;
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onEdit,
  onView,
  onMove,
  variant = 'list',
  showCategoryLabel = true
}) => {
  const overdue = task.dueDate && isBefore(startOfDay(task.dueDate), startOfDay(new Date()));

  const [confirmComplete, setConfirmComplete] = React.useState(false);

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      setConfirmComplete(true);
    } else {
      onToggle(task.id, false);
    }
  };

  const confirmDialog = (
    <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Marcar tarea como completada?</AlertDialogTitle>
          <AlertDialogDescription>
            La tarea "{task.title}" se marcará como completada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onToggle(task.id, true);
              setConfirmComplete(false);
            }}
          >
            Completar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  
  // Obtener estilo de categoría
  const categoryStyle = {
    bg: CATEGORY_COLORS[task.category as keyof typeof CATEGORY_COLORS]?.bg || 'bg-purple-100',
    text: CATEGORY_COLORS[task.category as keyof typeof CATEGORY_COLORS]?.text || 'text-purple-800'
  };

  const recurrenceDescription = getRecurrenceDescription(task.recurrence);
  const pInfo = getPriorityInfo(task.priority || 'none');

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, toNoon(new Date()));
  };

  const handleSetTomorrow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, toNoon(addDays(new Date(), 1)));
  };

  const handleRemoveDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, null);
  };

  if (variant === 'kanban') {
    return (
      <>
      <Card
        onClick={() => onView && onView(task)}
        className={cn(
          'cursor-pointer relative hover:shadow-md transition-all duration-200 border-0 shadow-sm',
          'text-sm w-full max-w-none lg:max-w-[18rem]',
          task.completed ? 'bg-muted/30' : overdue ? 'border-l-4 border-l-red-500 bg-red-50' : 'bg-white'
        )}
      >        <CardContent className="p-2 md:p-2 flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                {task.isPrivate && (
                  <span className="text-xs">🔒</span>
                )}
                <span className={cn(
                  'text-sm break-words line-clamp-2 font-medium',
                  task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                )}>
                  {task.title}
                </span>
              </div>
              
              {task.description && (
                <p className={cn(
                  'text-xs text-muted-foreground line-clamp-2 break-words leading-relaxed',
                  task.completed && 'line-through'
                )}>
                  {task.description}
                </p>
              )}                {/* Metadatos en kanban */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {/* Solo mostrar categoría si showCategoryLabel es true */}                {showCategoryLabel && (
                  <Badge className={cn("text-xs px-1.5 py-0.5", categoryStyle.bg, categoryStyle.text)}>
                    <Tag className="w-3 h-3 mr-1" />
                    {CATEGORY_LABELS[task.category]}
                  </Badge>
                )}

                {/* Mostrar prioridad en lugar de categoría cuando se oculta categoría */}
                {!showCategoryLabel && pInfo.label && (
                  <TooltipProvider>
                    <Tooltip>                      <TooltipTrigger asChild>
                        <Badge className={cn("text-xs px-1.5 py-0.5 text-white", pInfo.color)}>
                          {pInfo.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{pInfo.text}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Mostrar tamaño cuando no se muestra categoría */}                {!showCategoryLabel && task.size && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {task.size}
                  </Badge>
                )}                {task.dueDate && (
                  <Badge variant={overdue ? "destructive" : "secondary"} className="text-xs px-1.5 py-0.5">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDateToSpanish(task.dueDate)}
                    {overdue && " (vencida)"}
                  </Badge>
                )}                {task.isRecurrent && task.recurrence && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    <Repeat className="w-3 h-3 mr-1" />
                    {recurrenceDescription}
                  </Badge>
                )}
              </div>
            </div>
          </div>        </CardContent>
        
        {/* Footer con botones de acción para kanban */}
        <CardFooter className="px-2 py-1.5 bg-gray-50/50 border-t border-gray-100 p-0 md:p-0">
          <div className="flex justify-between w-full gap-1 px-2 py-1.5">
            {onMove && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 md:h-5 md:w-5 p-0 rounded-full hover:bg-muted"
                  title="Asignar para hoy"
                  onClick={handleSetToday}
                >
                  <span role="img" aria-label="hoy" className="text-sm md:text-xs">📅</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 md:h-5 md:w-5 p-0 rounded-full hover:bg-muted"
                  title="Asignar para mañana"
                  onClick={handleSetTomorrow}
                >
                  <span role="img" aria-label="mañana" className="text-sm md:text-xs">🌅</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 md:h-5 md:w-5 p-0 rounded-full hover:bg-muted"
                  title="Quitar fecha"
                  onClick={handleRemoveDate}
                >
                  <span role="img" aria-label="sin fecha" className="text-sm md:text-xs">❌</span>
                </Button>
              </div>
            )}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:h-5 md:w-5 p-0 rounded-full hover:bg-muted"
                title="Editar tarea"
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              >
                <Edit className="w-3.5 h-3.5 md:w-3 md:h-3 text-muted-foreground" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 md:h-5 md:w-5 p-0 rounded-full hover:bg-red-50"
                    title="Eliminar tarea"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <X className="w-3.5 h-3.5 md:w-3 md:h-3 text-red-500" />
                  </Button>
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
                      onClick={() => onDelete(task.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardFooter>
      </Card>
      {confirmDialog}
      </>
    );
  }

  // Vista Lista (horizontal, estilo Microsoft To-Do más compacta)
  return (
    <>
    <Card
      onClick={() => onView && onView(task)}
      className={cn(
        'cursor-pointer relative hover:shadow-sm transition-all duration-200 border-0 shadow-sm mb-2',
        'bg-white hover:bg-gray-50',
        task.completed && 'opacity-70 bg-gray-50',
        overdue && !task.completed && 'border-l-4 border-l-red-500 bg-red-50'
      )}
    >
      <CardContent className="flex items-center gap-2.5 py-2 px-3 md:py-2 md:px-3">
        {/* Checkbox */}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0 rounded-full shrink-0 hover:bg-transparent"
          onClick={handleToggleClick}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
          )}
        </Button>
          {/* Contenido principal */}
        <div className="flex-1 min-w-0 space-y-0.5">          {/* Título y descripción */}
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              {task.isPrivate && (
                <span className="text-xs opacity-70">🔒</span>
              )}
              <span className={cn(
                'text-sm break-words line-clamp-1 leading-tight font-medium',
                task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
              )}>
                {task.title}
              </span>
              {task.description && (
                <AlignLeft className="w-3 h-3 text-muted-foreground shrink-0 opacity-50" />
              )}
            </div>
            
            {task.description && (
              <p className={cn(
                'text-xs text-muted-foreground line-clamp-1 break-words leading-tight',
                task.completed && 'line-through'
              )}>
                {task.description}
              </p>
            )}
          </div>
            {/* Metadatos compactos */}
          <div className="flex flex-wrap gap-1">            {/* Categoría más pequeña */}
            <Badge className={cn("text-xs px-1 py-0.5 h-auto", categoryStyle.bg, categoryStyle.text)}>
              <Tag className="w-2.5 h-2.5 mr-1" />
              {CATEGORY_LABELS[task.category]}
            </Badge>            {/* Fecha de vencimiento */}
            {task.dueDate && (
              <Badge variant={overdue ? "destructive" : "secondary"} className="text-xs px-1 py-0.5 h-auto">
                <Calendar className="w-2.5 h-2.5 mr-1" />
                {formatDateToSpanish(task.dueDate)}
                {overdue && " (vencida)"}
              </Badge>
            )}            {/* Recurrencia */}
            {task.isRecurrent && task.recurrence && (
              <Badge variant="outline" className="text-xs px-1 py-0.5 h-auto">
                <Repeat className="w-2.5 h-2.5 mr-1" />
                {recurrenceDescription}
              </Badge>
            )}

            {/* Prioridad solo si no es recurrente */}
            {!task.isRecurrent && pInfo.label && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>                    <Badge
                      className={cn(
                        'text-xs px-1 py-0.5 text-white h-auto cursor-help',
                        pInfo.color
                      )}
                    >
                      {pInfo.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{pInfo.text}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>        {/* Botones de acción compactos */}
        <div className="flex gap-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 md:h-5 md:w-5 p-0 rounded-full hover:bg-muted"
            title="Editar tarea"
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          >
            <Edit className="w-3.5 h-3.5 md:w-3 md:h-3 text-muted-foreground" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:h-5 md:w-5 p-0 rounded-full hover:bg-red-50"
                title="Eliminar tarea"
                onClick={(e) => e.stopPropagation()}
              >
                <X className="w-3.5 h-3.5 md:w-3 md:h-3 text-red-500" />
              </Button>
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
                  onClick={() => onDelete(task.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
    {confirmDialog}
    </>
  );
};
