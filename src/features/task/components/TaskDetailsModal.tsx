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
  onToggle?: (taskId: string, completed: boolean) => void;
}

// Función para obtener información de prioridad
const getPriorityInfo = (priority?: string) => {
  const priorityMap = {
    do: { label: 'HACER', color: 'bg-red-500', text: 'Urgente e importante', urgent: true, important: true },
    decide: { label: 'DECIDIR', color: 'bg-yellow-500', text: 'Importante pero no urgente', urgent: false, important: true },
    delegate: { label: 'DELEGAR', color: 'bg-blue-500', text: 'Urgente pero no importante', urgent: true, important: false },
    delete: { label: 'ELIMINAR', color: 'bg-gray-500', text: 'Ni urgente ni importante', urgent: false, important: false },
    none: { label: '', color: '', text: '', urgent: false, important: false }
  };
  
  return priorityMap[priority as keyof typeof priorityMap] || priorityMap.none;
};

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggle?: (taskId: string, completed: boolean) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onToggle
}) => {
  if (!task) return null;

  const categoryStyle = CATEGORY_COLORS[task.category];
  const priorityInfo = getPriorityInfo(task.priority);
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
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] overflow-y-auto sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw]">
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
          </div>          <div className="md:col-span-4 space-y-4 text-sm">
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
              <span className="font-medium">Categoría:</span>
              <span className={
                `${categoryStyle.bg} ${categoryStyle.text} px-2 py-0.5 rounded-md text-xs flex items-center`
              }>
                {CATEGORY_LABELS[task.category]}
              </span>
            </p>

            {/* Prioridad */}
            {priorityInfo.label && (
              <p className="flex items-center gap-2">
                <span className="font-medium">Prioridad:</span>
                <Badge className={`text-xs text-white ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </Badge>
                <span className="text-xs text-gray-500">({priorityInfo.text})</span>
              </p>
            )}

            {/* Tamaño */}
            {task.size && (
              <p className="flex items-center gap-2">
                <span className="font-medium">Tamaño:</span>
                <Badge variant="outline" className="text-xs">
                  {task.size}
                </Badge>
              </p>
            )}            {/* Urgente/Importante */}
            {task.priority && (
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Urgente:</span>
                  <Badge variant={priorityInfo.urgent ? "default" : "secondary"} className="text-xs">
                    {priorityInfo.urgent ? "Sí" : "No"}
                  </Badge>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Importante:</span>
                  <Badge variant={priorityInfo.important ? "default" : "secondary"} className="text-xs">
                    {priorityInfo.important ? "Sí" : "No"}
                  </Badge>
                </p>
              </div>
            )}

            {/* Tarea privada */}
            {task.isPrivate && (
              <p className="flex items-center gap-2">
                <span className="font-medium">Privada:</span>
                <Badge variant="outline" className="text-xs">
                  🔒 Sí
                </Badge>
              </p>
            )}
            
            {task.isRecurrent && task.recurrence && (
              <p className="flex items-center gap-2">
                <span className="font-medium">Recurrencia:</span>
                <Badge variant="outline" className="text-xs font-normal px-2 py-0.5 text-accent-foreground border-accent">
                  {recurrenceDescription}
                </Badge>
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {onToggle && (
            <Button
              variant="secondary"
              onClick={() => onToggle(task.id, !task.completed)}
            >
              {task.completed ? 'Marcar incompleta' : 'Completar'}
            </Button>
          )}
          <Button onClick={() => onEdit(task)}>Editar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
