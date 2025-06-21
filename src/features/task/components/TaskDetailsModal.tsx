import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Task, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { isBefore, startOfDay } from 'date-fns';
import { formatDateToSpanish, getRecurrenceText } from '@/utils/dates';
import { renderMarkdown, getCheckboxStats } from '@/utils/markdown';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
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

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit
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
  const { total, checked } = getCheckboxStats(task.description || '');
  const hasCheckboxes = total > 0;
  const progress = hasCheckboxes ? task.progress ?? (checked / total) * 100 : 0;
  const descriptionHtml = renderMarkdown(task.description || '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header Section */}
          <DialogHeader className="space-y-4">
            <div className="flex items-start gap-3">
              {task.isPrivate && (
                <span className="text-lg mt-1">🔒</span>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold leading-tight break-words">
                  {task.title}
                </DialogTitle>
                {task.description && (
                  <div className="mt-3 space-y-3">
                    <div className="prose prose-sm max-w-none text-muted-foreground" 
                         dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                    {hasCheckboxes && (
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-right text-muted-foreground font-medium">
                          {checked} de {total} completadas
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Badges Section */}
          <div className="flex flex-wrap gap-2">
            {/* Category Badge */}
            <div className={`${categoryStyle.bg} ${categoryStyle.text} px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2`}>
              <span>📂</span>
              {CATEGORY_LABELS[task.category]}
            </div>

            {/* Priority Badge */}
            {priorityInfo.label && (
              <div className={`${priorityInfo.color} text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2`}>
                <span>⚡</span>
                {priorityInfo.label}
              </div>
            )}

            {/* Due Date Badge */}
            {task.dueDate && (
              <div className={`${overdue ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200'} px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border`}>
                <span>📅</span>
                {formatDateToSpanish(task.dueDate)}
                {overdue && ' (Vencida)'}
              </div>
            )}

            {/* Size Badge */}
            {task.size && (
              <div className="bg-gray-100 text-gray-800 border-gray-200 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border">
                <span>📏</span>
                {task.size}
              </div>
            )}

            {/* Recurrence Badge */}
            {task.isRecurrent && recurrenceDescription && (
              <div className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border">
                <span>🔄</span>
                {recurrenceDescription}
              </div>
            )}
          </div>

          {/* Priority Details */}
          {task.priority && priorityInfo.text && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Matriz de Eisenhower</h3>
              <p className="text-sm text-gray-600">{priorityInfo.text}</p>
              <div className="mt-3 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Urgente:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${priorityInfo.urgent ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                    {priorityInfo.urgent ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Importante:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${priorityInfo.important ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                    {priorityInfo.important ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-8 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={() => onEdit(task)} className="bg-blue-600 hover:bg-blue-700 text-white">
            Editar Tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
