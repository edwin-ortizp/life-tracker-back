import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { listEvents } from '@/utils/googleCalendar';

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string };
}

interface CalendarImportDialogProps {
  onImport: (events: { id: string; title: string; description?: string; dueDate?: Date }[]) => void;
}

const CalendarImportDialog: React.FC<CalendarImportDialogProps> = ({ onImport }) => {
  const { signedIn } = useGoogleCalendar();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && signedIn) {
      listEvents().then((items: any) => {
        setEvents(items || []);
      }).catch(() => setEvents([]));
    }
  }, [open, signedIn]);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleImport = () => {
    const selectedEvents = events.filter(e => selected.includes(e.id)).map(e => ({
      id: e.id,
      title: e.summary || 'Sin título',
      description: e.description || '',
      dueDate: e.start?.dateTime ? new Date(e.start.dateTime) : undefined
    }));
    onImport(selectedEvents);
    setOpen(false);
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!signedIn}>
          Importar desde Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Eventos</DialogTitle>
          <DialogDescription>
            Selecciona los eventos a convertir en tareas
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-60 overflow-y-auto space-y-2 py-2">
          {events.map(ev => (
            <label key={ev.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={selected.includes(ev.id)} onCheckedChange={() => toggle(ev.id)} />
              <span>{ev.summary || '(Sin título)'}</span>
            </label>
          ))}
          {events.length === 0 && (
            <p className="text-sm text-center text-muted-foreground">No hay eventos</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={selected.length === 0}>Importar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarImportDialog;
