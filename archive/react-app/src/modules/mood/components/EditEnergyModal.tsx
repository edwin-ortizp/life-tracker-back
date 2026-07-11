import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { createFormattedTimestamp } from '@/shared/utils/dates';
import { EnergySelector } from './EnergySelector';
import type { EditEnergyModalProps } from '../models';

export const EditEnergyModal: React.FC<EditEnergyModalProps> = ({
  isOpen,
  onClose,
  energyEntry,
  onSave,
  onDelete
}) => {
  const [time, setTime] = useState('');
  const [level, setLevel] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (energyEntry) {
      setTime(energyEntry.time);
      setLevel(energyEntry.level);
      setComment(energyEntry.comment || '');
    }
  }, [energyEntry]);

  const handleSave = async () => {
    if (!energyEntry) return;
    setSubmitting(true);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date(energyEntry.timestamp);
      const formattedTimestamp = createFormattedTimestamp(date, hours, minutes);
      await onSave({
        level,
        comment: comment || undefined,
        time,
        timestamp: formattedTimestamp.timestamp
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !energyEntry) return;
    setSubmitting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar registro</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <label htmlFor="time" className="text-sm">Hora:</label>
            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <Input
            type="text"
            placeholder="Comentario opcional"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <EnergySelector onSelect={(lvl) => setLevel(lvl)} disabled={false} />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {onDelete && (
            <Button variant="destructive" onClick={handleDelete} disabled={submitting} className="w-full sm:w-auto">
              Eliminar
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={submitting} className="flex-1 sm:flex-none">
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEnergyModal;
