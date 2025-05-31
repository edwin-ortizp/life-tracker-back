import { useState, useEffect } from 'react'; // Fragment removed
import type { PomodoroSession } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PomodoroEditModalProps {
  session: PomodoroSession | null;
  onClose: () => void;
  onSave: (oldSession: PomodoroSession, updatedSession: Partial<PomodoroSession>) => void;
}

export const PomodoroEditModal = ({
  session,
  onClose,
  onSave
}: PomodoroEditModalProps) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [completed, setCompleted] = useState(false);
  const [description, setDescription] = useState("");

  // Actualizar el estado cuando cambia la sesión seleccionada
  useEffect(() => {
    if (session) {
      const start = new Date(session.startTime.timestamp);
      const end = new Date(session.endTime.timestamp);
      
      setStartTime(
        `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
      );
      setEndTime(
        `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
      );
      setCompleted(session.completed);
      setDescription(session.description || "");
    }
  }, [session]);

  if (!session) return null;

  const handleSave = () => {
    const baseDate = new Date(session.startTime.timestamp);
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const newStartTime = new Date(baseDate);
    newStartTime.setHours(startHours, startMinutes, 0, 0);
    
    const newEndTime = new Date(baseDate);
    newEndTime.setHours(endHours, endMinutes, 0, 0);
    
    if (newEndTime < newStartTime) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }

    const updatedSession: Partial<PomodoroSession> = {
      startTime: {
        timestamp: newStartTime.getTime(),
        utcOffset: -newStartTime.getTimezoneOffset(),
        formatted: new Date(newStartTime).toLocaleString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true
        }) + ` UTC${-newStartTime.getTimezoneOffset() >= 0 ? '+' : '-'}${Math.abs(Math.floor(-newStartTime.getTimezoneOffset() / 60))}`
      },
      endTime: {
        timestamp: newEndTime.getTime(),
        utcOffset: -newEndTime.getTimezoneOffset(),
        formatted: new Date(newEndTime).toLocaleString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true
        }) + ` UTC${-newEndTime.getTimezoneOffset() >= 0 ? '+' : '-'}${Math.abs(Math.floor(-newEndTime.getTimezoneOffset() / 60))}`
      },
      duration: (newEndTime.getTime() - newStartTime.getTime()) / 1000,
      completed,
      description: description.trim() || undefined // Solo guardamos si hay descripción
    };

    onSave(session, updatedSession);
    onClose();
  };

  return (
    <Dialog open={!!session} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Sesión Pomodoro</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4"> {/* Added py-4 for padding similar to original p-6 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"> {/* Replaced space-y-2 with space-y-1 for tighter label-input */}
              <Label htmlFor="startTime">Hora inicio</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="endTime">Hora fin</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué hiciste en esta sesión?"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2"> {/* Added pt-2 for some spacing */}
            <Checkbox
              id="completed"
              checked={completed}
              onCheckedChange={(checkedState) => setCompleted(Boolean(checkedState))}
            />
            <Label
              htmlFor="completed"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Sesión completada
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};