// src/features/task/components/RecurrenceModal.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, AlignLeft, Type } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import type { RecurrenceModalProps } from '../types';

export const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  task,
  mode
}) => {
  // Función para calcular la próxima fecha sugerida
  const calculateNextDate = () => {
    if (!task.recurrence) return new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche
    
    switch (task.recurrence.pattern) {
      case 'daily':
        return addDays(today, 1);
      case 'weekly':
        return addWeeks(today, 1);
      case 'monthly':
        return addMonths(today, 1);
      case 'custom':
        return addDays(today, task.recurrence.customDays || 1);
      default:
        return today;
    }
  };

  const [formData, setFormData] = useState({
    title: task.title || '',
    description: task.description || '',
    dueDate: mode === 'complete' ? calculateNextDate() : (task.dueDate || new Date()),
    isRecurrent: task.isRecurrent || false,
    recurrence: task.recurrence
  });

  useEffect(() => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      dueDate: mode === 'complete' ? calculateNextDate() : (task.dueDate || new Date()),
      isRecurrent: task.isRecurrent || false,
      recurrence: task.recurrence
    });
  }, [task, mode]);

  // Función para formatear la próxima fecha de recurrencia
  const getRecurrenceText = () => {
    if (!formData.recurrence) return '';
    
    const nextDate = formData.dueDate;
    const dateText = format(nextDate, "'próximo' EEEE", { locale: es });
    
    switch (formData.recurrence.pattern) {
      case 'daily':
        return `Diariamente (${dateText})`;
      case 'weekly':
        return `Semanalmente (${dateText})`;
      case 'monthly':
        return `Mensualmente (${format(nextDate, "'próximo' d 'de' MMMM", { locale: es })})`;
      case 'custom':
        return `Cada ${formData.recurrence.customDays} días (${dateText})`;
      default:
        return '';
    }
  };

  const handleConfirm = () => {
    onConfirm({
      title: formData.title.trim(),
      description: formData.description,
      dueDate: formData.dueDate,
      isRecurrent: formData.isRecurrent,
      recurrence: formData.isRecurrent ? formData.recurrence : undefined
    });
    onClose();
  };

  // Ajustar fecha para considerar zona horaria
  const formatDateForInput = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
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
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Type className="w-4 h-4" />
                Título
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({
                  ...formData,
                  title: e.target.value
                })}
                placeholder="Título de la tarea..."
              />
            </div>
          )}

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              Descripción
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({
                ...formData,
                description: e.target.value
              })}
              placeholder="Agrega más detalles sobre la tarea..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Fecha de vencimiento */}
          {mode === 'edit' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha límite
                </label>
                {formData.dueDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      dueDate: new Date()
                    })}
                  >
                    Quitar fecha
                  </Button>
                )}
              </div>
              <Input
                type="date"
                value={formData.dueDate ? formatDateForInput(formData.dueDate) : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  if (date) {
                    date.setHours(12, 0, 0, 0); // Establecer al mediodía para evitar problemas de zona horaria
                  }
                  setFormData({
                    ...formData,
                    dueDate: date || new Date()
                  });
                }}
              />
            </div>
          ) : (
            task.isRecurrent && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Próxima fecha
                </label>
                <Input
                  type="date"
                  value={formData.dueDate ? formatDateForInput(formData.dueDate) : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    if (date) {
                      date.setHours(12, 0, 0, 0);
                    }
                    setFormData({
                      ...formData,
                      dueDate: date || new Date()
                    });
                  }}
                />
              </div>
            )
          )}

          {/* Recurrencia - solo en modo edición */}
          {mode === 'edit' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurrent"
                  checked={formData.isRecurrent}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    isRecurrent: checked as boolean,
                    recurrence: checked ? {
                      pattern: 'daily',
                      frequency: 1
                    } : undefined
                  })}
                />
                <label
                  htmlFor="isRecurrent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tarea recurrente
                </label>
              </div>

              {formData.isRecurrent && (
                <div className="pl-6 space-y-4">
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.recurrence?.pattern}
                    onChange={(e) => {
                      const pattern = e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom';
                      const newDate = new Date();
                      newDate.setHours(12, 0, 0, 0);
                      
                      let nextDate;
                      switch (pattern) {
                        case 'daily':
                          nextDate = addDays(newDate, 1);
                          break;
                        case 'weekly':
                          nextDate = addWeeks(newDate, 1);
                          break;
                        case 'monthly':
                          nextDate = addMonths(newDate, 1);
                          break;
                        case 'custom':
                          nextDate = addDays(newDate, 1);
                          break;
                      }

                      setFormData({
                        ...formData,
                        dueDate: nextDate,
                        recurrence: {
                          frequency: 1,
                          pattern,
                          customDays: pattern === 'custom' ? 1 : undefined
                        }
                      });
                    }}
                  >
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensualmente</option>
                    <option value="custom">Personalizado</option>
                  </select>

                  {formData.recurrence?.pattern === 'custom' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={formData.recurrence?.customDays}
                        onChange={(e) => {
                          const days = parseInt(e.target.value);
                          const newDate = new Date();
                          newDate.setHours(12, 0, 0, 0);
                          
                          setFormData({
                            ...formData,
                            dueDate: addDays(newDate, days),
                            recurrence: {
                              ...formData.recurrence!,
                              customDays: days
                            }
                          });
                        }}
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">días</span>
                    </div>
                  )}

                  {formData.recurrence && (
                    <div className="text-sm text-blue-600">
                      {getRecurrenceText()}
                    </div>
                  )}
                </div>
              )}
            </div>
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