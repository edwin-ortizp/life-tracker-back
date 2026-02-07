/**
 * AddCalendarDialog Component
 *
 * Dialog for adding a new external calendar via public iCal URL
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Plus, AlertCircle, Info } from 'lucide-react';
import { DEFAULT_CALENDAR_COLORS } from '../constants';
import { isValidICalUrl } from '@/modules/external-calendar/utils/icalParser';

interface AddCalendarDialogProps {
  onAdd: (name: string, url: string, color: string) => void;
  trigger?: React.ReactNode;
}

export function AddCalendarDialog({ onAdd, trigger }: AddCalendarDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_CALENDAR_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name
    if (!name.trim()) {
      setError('El nombre del calendario es obligatorio');
      return;
    }

    // Validate URL
    if (!url.trim()) {
      setError('La URL del calendario es obligatoria');
      return;
    }

    if (!isValidICalUrl(url)) {
      setError('La URL debe ser una URL pública de Google Calendar en formato iCal (HTTPS)');
      return;
    }

    // Add calendar
    onAdd(name.trim(), url.trim(), selectedColor);

    // Reset form
    setName('');
    setUrl('');
    setSelectedColor(DEFAULT_CALENDAR_COLORS[0]);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset on close
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Calendario
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Calendario Externo</DialogTitle>
            <DialogDescription>
              Agrega un calendario de Google Calendar mediante su URL pública en formato iCal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="calendar-name">Nombre del Calendario</Label>
              <Input
                id="calendar-name"
                placeholder="Ej: Calendario Laboral"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="calendar-url">URL Pública (iCal)</Label>
              <Input
                id="calendar-url"
                type="url"
                placeholder="https://calendar.google.com/calendar/ical/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Debe ser una URL HTTPS que termine en .ics
              </p>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_CALENDAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: selectedColor === color ? '#000' : 'transparent',
                    }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* How to get URL */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>¿Cómo obtener la URL?</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Abre Google Calendar en tu navegador</li>
                  <li>Ve a Configuración → Configuración del calendario</li>
                  <li>Selecciona el calendario que deseas agregar</li>
                  <li>En "Integrar calendario", copia la "Dirección secreta en formato iCal"</li>
                </ol>
                <p className="mt-2 text-muted-foreground">
                  <strong>Nota:</strong> La sincronización usa un proxy (corsproxy.io) para resolver
                  restricciones CORS del navegador.
                </p>
              </AlertDescription>
            </Alert>

            {/* Privacy Warning */}
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Advertencia de Privacidad:</strong> Al usar calendarios públicos, cualquier persona con
                la URL puede ver tus eventos. Para calendarios laborales, puedes usar el modo "mostrar solo si
                estoy ocupado o libre" en Google Calendar para ocultar detalles de eventos.
              </AlertDescription>
            </Alert>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Agregar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
