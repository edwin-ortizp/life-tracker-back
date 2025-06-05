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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          {task.description && (
            <DialogDescription>{task.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4 space-y-4">
          {task.dueDate && (
            <p className="text-sm">
              <span className="font-medium">Fecha límite:</span>{' '}
              {formatDateToSpanish(task.dueDate)}
            </p>
          )}
          <p className="text-sm flex items-center gap-2">
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

        <DialogFooter>
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
