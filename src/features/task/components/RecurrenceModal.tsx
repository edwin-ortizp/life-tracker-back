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
import TaskAiBreakdown from './TaskAiBreakdown';
import TaskAiImproveDescription from './TaskAiImproveDescription';
import TaskAiIdeas from './TaskAiIdeas';
import { TaskDateTimeRangeInput } from './TaskDateTimeRangeInput';
import { TaskCategorySelect } from './TaskCategorySelect';
import TaskEstimatedTimeInput from './TaskEstimatedTimeInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TaskRecurrenceConfig } from './TaskRecurrenceConfig';
import { useRecurrenceLogic } from '../hooks/useRecurrenceLogic';
import { useTaskKeyboardShortcuts } from '../hooks/useTaskKeyboardShortcuts';
import type { RecurrenceModalProps, TaskFormData } from '../types';

export const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  task,
  mode
}) => {
  const { calculateNextDate } = useRecurrenceLogic({
    initialConfig: task.recurrence,
    initialDate: task.startDate
  });
  const [formData, setFormData] = useState<TaskFormData>(() => {
    if (mode === 'create') {
      return {
        title: '',
        description: '',
        category: 'personal',
        isRecurrent: false,
        isPrivate: task.isPrivate || false,
        priority: 'delete',
        size: 'peque\u00f1a',
        estimatedTime: undefined,
        timeOfDay: undefined
      };
    }
    
    return {
      title: task.title || '',
      description: task.description || '',
      startDate: mode === 'complete' ? calculateNextDate(new Date(), task.recurrence) : (task.startDate || undefined),
      endDate: task.endDate || undefined,
      isRecurrent: task.isRecurrent ?? false,
      isPrivate: task.isPrivate ?? false,
      category: task.category || 'personal',
      recurrence: task.recurrence,
      priority: task.priority || 'delete',
      size: task.size || 'peque\u00f1a',
      estimatedTime: task.estimatedTime,
      timeOfDay: task.timeOfDay
    };
  });

  const [urgent, setUrgent] = useState<boolean>(() => {
    return task.priority === 'do' || task.priority === 'delegate';
  });
  const [important, setImportant] = useState<boolean>(() => {
    return task.priority === 'do' || task.priority === 'decide';
  });
  const [sizeState, setSizeState] = useState<'peque\u00f1a' | 'mediana' | 'grande'>(task.size || 'peque\u00f1a');

  useEffect(() => {
    if (isOpen) {
        if (mode === 'create') {
        setFormData({
            title: '',
            description: '',
            category: 'personal',
            isRecurrent: false,
            isPrivate: task.isPrivate || false,
            priority: 'delete',
            size: 'peque\u00f1a',
            estimatedTime: undefined,
            timeOfDay: undefined
          });
        setUrgent(false);
        setImportant(false);
        setSizeState('peque\u00f1a');
        } else {
        setFormData({
            title: task.title || '',
            description: task.description || '',
            startDate: mode === 'complete' ? calculateNextDate(new Date(), task.recurrence) : (task.startDate || undefined),
            endDate: task.endDate || undefined,
            isRecurrent: task.isRecurrent || false,
            isPrivate: task.isPrivate || false,
            category: task.category || 'personal',
            recurrence: task.recurrence,
            priority: task.priority || 'delete',
            size: task.size || 'peque\u00f1a',
            estimatedTime: task.estimatedTime,
            timeOfDay: task.timeOfDay
          });
        setUrgent(task.priority === 'do' || task.priority === 'delegate');
        setImportant(task.priority === 'do' || task.priority === 'decide');
        setSizeState(task.size || 'peque\u00f1a');
      }
    }
  }, [task, mode, isOpen]);

  const handleConfirm = () => {
    if (!formData.title.trim()) return;
    const priority = urgent && important
      ? 'do'
      : important
      ? 'decide'
      : urgent
      ? 'delegate'
      : 'delete';

    if (mode === 'create') {
      const lines = formData.title
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
      lines.forEach(title => {
        onConfirm({ ...formData, title, priority, size: sizeState });
      });
      onClose();
    } else {
      onConfirm({ ...formData, priority, size: sizeState });
    }
  };

  // Initialize keyboard shortcuts with Ctrl+S functionality
  useTaskKeyboardShortcuts({
    openCreateModal: () => {}, // Not needed in modal
    onSave: handleConfirm,
    isModalOpen: isOpen
  });

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
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] h-[80vh] overflow-y-auto sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          {mode === 'complete' && (
            <DialogDescription>{task.title}</DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-6 py-4 lg:grid-cols-2">
          <div className="space-y-4">
            {mode !== 'complete' && (
              <TaskTitleInput
                multiline={mode === 'create'}
                value={formData.title}
                onChange={(title) => setFormData({ ...formData, title })}
              />
            )}

            <TaskDescriptionInput
              value={formData.description || ''}
              onChange={(description) => setFormData({ ...formData, description })}
            />
            {mode === 'edit' && (
              <>
                <TaskAiBreakdown
                  title={formData.title}
                  description={formData.description || ''}
                  onInsert={(text) =>
                    setFormData({
                      ...formData,
                      description: (formData.description ? formData.description + '\n' : '') + text
                    })
                  }
                />
                <TaskAiImproveDescription
                  title={formData.title}
                  description={formData.description || ''}
                  onInsert={(text) =>
                    setFormData({
                      ...formData,
                      description: (formData.description ? formData.description + '\n' : '') + text
                    })
                  }
                />
                <TaskAiIdeas
                  title={formData.title}
                  description={formData.description || ''}
                  onInsert={(text) =>
                    setFormData({
                      ...formData,
                      description: (formData.description ? formData.description + '\n' : '') + text
                    })
                  }
                />
              </>
            )}
          </div>

          <div className="space-y-6">
            {mode !== 'complete' && (
              <TaskCategorySelect
                value={formData.category}
                onChange={(category) => setFormData({ ...formData, category })}
              />
            )}

            {mode !== 'complete' && (
              <TaskDateTimeRangeInput
                startDate={formData.startDate}
                endDate={formData.endDate}
                onStartDateChange={(startDate) => setFormData({ ...formData, startDate })}
                onEndDateChange={(endDate) => setFormData({ ...formData, endDate })}
                showClearButton
              />
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
            {mode !== 'complete' && (
              <TaskEstimatedTimeInput
                value={formData.estimatedTime}
                onChange={(value) => setFormData({ ...formData, estimatedTime: value })}
              />
            )}
            {mode !== 'complete' && (
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={urgent} onCheckedChange={(v) => setUrgent(Boolean(v))} />
                  Urgente
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={important} onCheckedChange={(v) => setImportant(Boolean(v))} />
                  Importante
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox 
                    checked={formData.isPrivate ?? false} 
                    onCheckedChange={(v) => setFormData({ ...formData, isPrivate: Boolean(v) })} 
                  />
                  🔒 Privada (solo en Journal)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tamaño</span>
                  <Select value={sizeState} onValueChange={(v) => setSizeState(v as 'pequeña' | 'mediana' | 'grande')}>
                    <SelectTrigger className="h-8 w-28">
                      <SelectValue placeholder="Tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequeña">pequeña</SelectItem>
                      <SelectItem value="mediana">mediana</SelectItem>
                      <SelectItem value="grande">grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
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