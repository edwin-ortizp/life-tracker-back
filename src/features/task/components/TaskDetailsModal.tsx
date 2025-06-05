import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { isBefore, startOfDay } from 'date-fns';
import { formatDateToSpanish, getRecurrenceText } from '@/utils/dates';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!task) return null;

  const categoryStyle = CATEGORY_COLORS[task.category];
  const recurrenceDescription =
    task.isRecurrent && task.recurrence
      ? getRecurrenceText(
          task.dueDate || new Date(),
          task.recurrence.pattern,
          task.recurrence.customDays
        )
      : '';
  const overdue =
    task.dueDate &&
    isBefore(startOfDay(task.dueDate), startOfDay(new Date()));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8 space-y-4">
            <DialogHeader className="text-left">
              <DialogTitle>{task.title}</DialogTitle>
              {task.description && (
                <DialogDescription className="whitespace-pre-line">
                  {task.description}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>
          <div className="md:col-span-4 space-y-4 text-sm">
            {task.dueDate && (
              <p className="flex items-center gap-2">
                <span className="font-medium">Fecha límite:</span>
                <Badge
                  variant={overdue ? 'destructive' : 'secondary'}
                  className="text-xs font-normal px-2 py-0.5"
                >
                  {formatDateToSpanish(task.dueDate)}
                  {overdue ? ' (vencida)' : ''}
                </Badge>
              </p>
            )}
            <p className="flex items-center gap-2">
              <span className={
                `${categoryStyle.bg} ${categoryStyle.text} px-2 py-0.5 rounded-md text-xs flex items-center`
              }>
                {CATEGORY_LABELS[task.category]}
              </span>
            </p>
            {task.isRecurrent && task.recurrence && (
              <Badge variant="outline" className="text-xs font-normal px-2 py-0.5 text-accent-foreground border-accent">
                {recurrenceDescription}
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={() => onEdit(task)}>Editar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
