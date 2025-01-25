// src/features/task/components/RecurrenceModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TaskTitleInput } from './TaskTitleInput';
import { TaskDescriptionInput } from './TaskDescriptionInput';
import { TaskDateInput } from './TaskDateInput';
import { TaskCategorySelect } from './TaskCategorySelect';
import { TaskRecurrenceConfig } from './TaskRecurrenceConfig';
import { useRecurrenceLogic } from '../hooks/useRecurrenceLogic';
import type { TaskCategory, RecurrenceModalProps, TaskFormData } from '../types';

export const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  task,
  mode
}) => {
  const { calculateNextDate } = useRecurrenceLogic({
    initialConfig: task.recurrence,
    initialDate: task.dueDate
  });

  const [formData, setFormData] = useState<TaskFormData>({
    title: task.title || '',
    description: task.description || '',
    dueDate: mode === 'complete' ? calculateNextDate(new Date(), task.recurrence) : (task.dueDate || new Date()),
    isRecurrent: task.isRecurrent || false,
    category: task.category || 'other',
    recurrence: task.recurrence
  });

  useEffect(() => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      dueDate: mode === 'complete' ? calculateNextDate(new Date(), task.recurrence) : (task.dueDate || new Date()),
      isRecurrent: task.isRecurrent || false,
      category: task.category || 'other',
      recurrence: task.recurrence
    });
  }, [task, mode]);

  const handleConfirm = () => {
    onConfirm({
      title: formData.title.trim(),
      description: formData.description,
      dueDate: formData.dueDate,
      isRecurrent: formData.isRecurrent,
      category: formData.category,
      recurrence: formData.isRecurrent ? formData.recurrence : undefined
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'complete' ? 'Completar tarea' : 'Editar tarea'}
          </DialogTitle>
          {mode === 'complete' && (
            <DialogDescription>{task.title}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Título - solo en modo edición */}
          {mode === 'edit' && (
            <TaskTitleInput
              value={formData.title}
              onChange={(title) => setFormData({ ...formData, title })}
            />
          )}

          {/* Categoría - solo en modo edición */}
          {mode === 'edit' && (
            <TaskCategorySelect
              value={formData.category}
              onChange={(category) => setFormData({ ...formData, category })}
            />
          )}

          {/* Descripción */}
          <TaskDescriptionInput
            value={formData.description || ''}
            onChange={(description) => setFormData({ ...formData, description })}
          />

          {/* Fecha de vencimiento */}
          {mode === 'edit' ? (
            <TaskDateInput
              value={formData.dueDate}
              onChange={(dueDate) => setFormData({ ...formData, dueDate })}
              showClearButton
            />
          ) : (
            task.isRecurrent && (
              <TaskDateInput
                value={formData.dueDate}
                onChange={(dueDate) => setFormData({ ...formData, dueDate })}
                label="Próxima fecha"
              />
            )
          )}

          {/* Recurrencia - solo en modo edición */}
          {mode === 'edit' && (
            <TaskRecurrenceConfig
              isRecurrent={formData.isRecurrent ?? false}
              onRecurrentChange={(isRecurrent) => setFormData({
                ...formData,
                isRecurrent,
                recurrence: isRecurrent ? {
                  pattern: 'daily',
                  frequency: 1
                } : undefined
              })}
              config={formData.recurrence}
              onConfigChange={(recurrence) => setFormData({
                ...formData,
                recurrence,
                dueDate: calculateNextDate(new Date(), recurrence)
              })}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            {mode === 'complete' ? 'Completar' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecurrenceModal;