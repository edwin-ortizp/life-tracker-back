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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TaskRecurrenceConfig } from './TaskRecurrenceConfig';
import { useRecurrenceLogic } from '../hooks/useRecurrenceLogic';
import { useTaskKeyboardShortcuts } from '../hooks/useTaskKeyboardShortcuts';
import type { RecurrenceModalProps, TaskFormData } from '../types';

const formatElapsedTime = (seconds?: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
};

const parseElapsedTime = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+):([0-5]\d):([0-5]\d)$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return hours * 3600 + minutes * 60 + seconds;
};

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
  const [elapsedInput, setElapsedInput] = useState<string>(formatElapsedTime(task.elapsedSeconds));
  const [formError, setFormError] = useState<string | null>(null);

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
        setElapsedInput(formatElapsedTime(0));
        setFormError(null);
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
            timeOfDay: task.timeOfDay,
            elapsedSeconds: task.elapsedSeconds
          });
        setUrgent(task.priority === 'do' || task.priority === 'delegate');
        setImportant(task.priority === 'do' || task.priority === 'decide');
        setSizeState(task.size || 'peque\u00f1a');
        setElapsedInput(formatElapsedTime(task.elapsedSeconds));
        setFormError(null);
      }
    }
  }, [task, mode, isOpen]);

  useEffect(() => {
    if (mode === 'complete') return;
    if (!formData.startDate || !formData.endDate) return;

    const diffMs = formData.endDate.getTime() - formData.startDate.getTime();
    const minutes = Math.max(0, Math.round(diffMs / 60000));

    setFormData((prev) => (prev.estimatedTime === minutes ? prev : { ...prev, estimatedTime: minutes }));
  }, [formData.startDate, formData.endDate, mode]);

  const handleConfirm = async () => {
    if (!formData.title.trim()) return;
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }
    const elapsedSeconds = parseElapsedTime(elapsedInput);
    if (elapsedSeconds === null) {
      setFormError('El valor no es valido.');
      return;
    }

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
      for (const title of lines) {
        await Promise.resolve(onConfirm({ ...formData, title, priority, size: sizeState, elapsedSeconds }));
      }
      onClose();
    } else {
      await Promise.resolve(onConfirm({ ...formData, priority, size: sizeState, elapsedSeconds }));
      onClose();
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
                onChange={(title) => setFormData(prev => ({ ...prev, title }))}
              />
            )}

            <TaskDescriptionInput
              value={formData.description || ''}
              onChange={(description) => setFormData(prev => ({ ...prev, description }))}
            />
            {mode === 'edit' && (
              <>
                <TaskAiBreakdown
                  title={formData.title}
                  description={formData.description || ''}
                  onInsert={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      description: (prev.description ? prev.description + '\n' : '') + text
                    }))
                  }
                />
                <TaskAiImproveDescription
                  title={formData.title}
                  description={formData.description || ''}
                  onInsert={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      description: (prev.description ? prev.description + '\n' : '') + text
                    }))
                  }
                />
                <TaskAiIdeas
                  title={formData.title}
                  description={formData.description || ''}
                  onInsert={(text) =>
                    setFormData(prev => ({
                      ...prev,
                      description: (prev.description ? prev.description + '\n' : '') + text
                    }))
                  }
                />
              </>
            )}
          </div>

          <div className="space-y-6">
            {mode !== 'complete' && (
              <TaskCategorySelect
                value={formData.category}
                onChange={(category) => setFormData(prev => ({ ...prev, category }))}
              />
            )}

            {mode !== 'complete' && (
              <TaskDateTimeRangeInput
                startDate={formData.startDate}
                endDate={formData.endDate}
                onStartDateChange={(startDate) => {
                  setFormData(prev => ({ ...prev, startDate }));
                  setFormError(null);
                }}
                onEndDateChange={(endDate) => {
                  setFormData(prev => ({ ...prev, endDate }));
                  setFormError(null);
                }}
                showClearButton
              />
            )}

            {mode !== 'complete' && (
              <TaskRecurrenceConfig
                isRecurrent={formData.isRecurrent ?? false}
                onRecurrentChange={(isRecurrent) => setFormData(prev => ({
                  ...prev,
                  isRecurrent,
                  recurrence: isRecurrent ? {
                    pattern: 'daily',
                    frequency: 1
                  } : undefined
                }))}
                config={formData.recurrence}
                onConfigChange={(recurrence) => setFormData(prev => ({
                  ...prev,
                  recurrence
                }))}
              />
            )}
            {mode !== 'complete' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiempo estimado (min)</label>
                  <Input
                    type="number"
                    min="0"
                    readOnly
                    placeholder="Calculado"
                    value={formData.estimatedTime ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiempo ejecutado (HH:MM:SS)</label>
                  <Input
                    value={elapsedInput}
                    onChange={(e) => {
                      setElapsedInput(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="00:00:00"
                  />
                </div>
              </div>
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
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isPrivate: Boolean(v) }))}
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

        {formError && (
          <div className="text-sm text-red-600">
            {formError}
          </div>
        )}

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
