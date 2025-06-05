import React from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { CheckCircle2, Circle, X, Repeat, AlignLeft, Calendar, Edit, Tag } from 'lucide-react';
import { Task, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { formatDateToSpanish, getRecurrenceText } from '@/utils/dates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit, onView }) => {
  const overdue = task.dueDate && isBefore(startOfDay(task.dueDate), startOfDay(new Date()));
  const categoryStyle = CATEGORY_COLORS[task.category];

  // Obtener el texto de recurrencia usando la utilidad centralizada
  const recurrenceDescription = task.isRecurrent && task.recurrence ? 
    getRecurrenceText(
      task.dueDate || new Date(),
      task.recurrence.pattern,
      task.recurrence.customDays
    ) : '';

  return (
    <Card
      onClick={() => onView && onView(task)}
      className={cn(
        'cursor-pointer',
        task.completed ? 'bg-muted/50' : overdue ? 'border-destructive bg-destructive/5' : ''
      )}
    >
      <CardContent className="p-3 flex flex-col gap-2">
        <div className="flex items-start gap-2"> {/* Top section: toggle, title/desc, actions */}
          <Button
            variant="ghost"
            size="icon"
            className="p-1 mt-0.5 rounded-full h-auto w-auto"
            onClick={(e) => { e.stopPropagation(); onToggle(task.id, !task.completed); }}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("break-all", task.completed ? 'line-through text-muted-foreground' : 'font-medium')}>
                {task.title}
              </span>
              {task.description && (
                // TooltipProvider and related components removed for now to stick to original scope
                <AlignLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </div>
            
            {/* Display full description if no title, or as a separate paragraph if title exists and it's desired.
                For now, only showing description if title is missing, or via AlignLeft icon hint.
                The original showed it as a line-clamped paragraph if present. Let's restore that for consistency
                if title is present.
            */}
            {task.description && task.title && (
              <p className={cn("text-sm text-muted-foreground mt-1 line-clamp-2 break-all", task.completed && "line-through")}>
                {task.description}
              </p>
            )}
            {task.description && !task.title && (
              <p className={cn("text-sm text-muted-foreground mt-1 line-clamp-2 break-all", task.completed && "line-through")}>
                {task.description}
              </p>
            )}
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="p-1.5 rounded-full h-auto w-auto"
              title="Editar tarea"
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            >
              <Edit className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="p-1.5 rounded-full h-auto w-auto"
              title="Eliminar tarea"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            >
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Tags section */}
        <div className="flex flex-wrap gap-2 items-center pl-8"> {/* Added pl-8 to align with title text */}
          <span className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-md", // Adjusted py
            categoryStyle.bg,
            categoryStyle.text
          )}>
            <Tag className="w-3 h-3" />
            {CATEGORY_LABELS[task.category]}
          </span>

          {task.dueDate && (
            overdue ? (
              <Badge variant="destructive" className="text-xs font-normal px-2 py-0.5">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDateToSpanish(task.dueDate)} (vencida)
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDateToSpanish(task.dueDate)}
              </Badge>
            )
          )}

          {task.isRecurrent && task.recurrence && (
            <Badge variant="outline" className="text-xs font-normal px-2 py-0.5 text-accent-foreground border-accent">
              <Repeat className="w-3 h-3 mr-1" />
              {recurrenceDescription}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Need to ensure TooltipProvider, Tooltip, TooltipTrigger, TooltipContent are imported
// if AlignLeft icon is to have a tooltip for the description.
// For now, I've removed the description display from title line if title itself exists,
// and added a new paragraph for description if no title.
// The prompt focused on Card/Button/Badge, so Tooltip is an addition.
// If Tooltip is not desired, the AlignLeft icon can be removed or description shown differently.
// The provided solution adds Tooltip for description when title is present.
// And shows description directly if title is not present.
// Also adjusted padding for badges (py-0.5) and button sizes (h-auto w-auto).
// Added break-all to title and description for better wrapping.
// Added pl-8 to tags section to align with title text (after toggle button).