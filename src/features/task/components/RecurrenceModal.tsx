// src/features/task/components/RecurrenceModal.tsx
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

  const [formData, setFormData] = useState<TaskFormData>(() => {
    if (mode === 'create') {
      return {
        title: '',
        description: '',
        category: 'personal',
        isRecurrent: false,
      };
    }
    
    return {
      title: task.title || '',
      description: task.description || '',
      dueDate: mode === 'complete' ? calculateNextDate(new Date(), task.recurrence) : (task.dueDate || undefined),
      isRecurrent: task.isRecurrent ?? false,
      category: task.category || 'personal',
      recurrence: task.recurrence
    };
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setFormData({
          title: '',
          description: '',
          category: 'personal',
          isRecurrent: false,
        });
      } else {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          dueDate: mode === 'complete' ? calculateNextDate(new Date(), task.recurrence) : (task.dueDate || undefined),
          isRecurrent: task.isRecurrent || false,
          category: task.category || 'personal',
          recurrence: task.recurrence
        });
      }
    }
  }, [task, mode, isOpen]);

  const handleConfirm = () => {
    if (!formData.title.trim()) return;
    onConfirm(formData);
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Nueva Tarea';
      case 'edit':
        return 'Editar Tarea';
      case 'complete':
        return 'Completar Tarea';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          {mode === 'complete' && (
            <DialogDescription>{task.title}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {mode !== 'complete' && (
            <TaskTitleInput
              value={formData.title}
              onChange={(title) => setFormData({ ...formData, title })}
            />
          )}

          {mode !== 'complete' && (
            <TaskCategorySelect
              value={formData.category}
              onChange={(category) => setFormData({ ...formData, category })}
            />
          )}

          <TaskDescriptionInput
            value={formData.description || ''}
            onChange={(description) => setFormData({ ...formData, description })}
          />

          {mode === 'edit' ? (
            <TaskDateInput
              value={formData.dueDate}
              onChange={(dueDate) => setFormData({ ...formData, dueDate })}
              showClearButton
            />
          ) : mode === 'create' ? (
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

          {mode !== 'complete' && (
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
                recurrence
              })}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!formData.title.trim()}
          >
            {mode === 'complete' ? 'Completar' : mode === 'create' ? 'Crear' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecurrenceModal;