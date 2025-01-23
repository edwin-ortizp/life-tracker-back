// src/features/mood/components/EditMoodModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFormattedTimestamp } from '@/utils/dates';
import type { EditMoodModalProps } from '../types';

export const EditMoodModal: React.FC<EditMoodModalProps> = ({
  isOpen,
  onClose,
  moodEntry,
  onSave,
  onDelete
}) => {
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (moodEntry?.time) {
      setTime(moodEntry.time);
    }
  }, [moodEntry]);

  const handleSave = async () => {
    if (!moodEntry) return;
    
    setIsSubmitting(true);
    try {
      // Crear una nueva fecha con la hora seleccionada
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date(moodEntry.timestamp);
      
      const formattedTimestamp = createFormattedTimestamp(date, hours, minutes);

      await onSave({
        ...moodEntry,
        time,
        timestamp: formattedTimestamp.timestamp
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsSubmitting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error al eliminar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar registro</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 py-4">
          <span className="text-2xl">{moodEntry?.emoji}</span>
          <span>{moodEntry?.text}</span>
        </div>
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <label htmlFor="time" className="text-sm">Hora:</label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Eliminar
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};