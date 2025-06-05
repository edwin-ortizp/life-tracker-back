// src/features/mood/components/ImportMoodButton.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { createFormattedTimestamp } from '@/utils/dates';
import { toast } from 'sonner';
import type { MoodEntry, DailyMood } from '../types';

interface ImportMoodData {
  date: string;
  moods: Array<{
    emoji: string;
    text: string;
    time?: string; // Opcional - si no se proporciona, se usará la hora actual
    hour?: number; // Alternativo para especificar solo la hora
    minute?: number; // Alternativo para especificar solo los minutos
  }>;
}

export const ImportMoodButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useAuth();

  const handleImport = async () => {
    if (!user || !jsonText.trim()) return;

    setIsImporting(true);
    setError(null);

    try {
      const data: ImportMoodData[] = JSON.parse(jsonText);
      
      if (!Array.isArray(data)) {
        throw new Error('El JSON debe ser un array de objetos');
      }

      let importedCount = 0;

      for (const dayData of data) {
        if (!dayData.date || !Array.isArray(dayData.moods)) {
          console.warn('Datos inválidos para un día:', dayData);
          continue;
        }

        const docId = `${user.uid}_${dayData.date}`;
        const moodRef = doc(collection(db, 'moods'), docId);

        // Verificar si ya existe el documento
        const existingDoc = await getDoc(moodRef);
        const existingMoods = existingDoc.exists() ? existingDoc.data()?.moods || [] : [];

        // Convertir los estados de ánimo del JSON al formato correcto
        const newMoods: MoodEntry[] = dayData.moods.map((mood, index) => {
          let time: string;
          let timestamp: number;

          if (mood.time) {
            // Si se proporciona time, usarlo directamente
            time = mood.time;
            // Crear timestamp basado en la fecha y hora proporcionada
            const [hours, minutes] = mood.time.split(':').map(Number);
            const date = new Date(dayData.date);
            date.setHours(hours, minutes, 0, 0);
            timestamp = date.getTime();
          } else if (mood.hour !== undefined && mood.minute !== undefined) {
            // Si se proporcionan hour y minute
            time = `${mood.hour.toString().padStart(2, '0')}:${mood.minute.toString().padStart(2, '0')}`;
            const date = new Date(dayData.date);
            date.setHours(mood.hour, mood.minute, 0, 0);
            timestamp = date.getTime();
          } else {
            // Si no se proporciona hora, usar hora actual con incremento
            const now = new Date();
            const baseHour = now.getHours();
            const baseMinute = now.getMinutes() + index; // Incrementar minutos para evitar duplicados
            time = `${baseHour.toString().padStart(2, '0')}:${(baseMinute % 60).toString().padStart(2, '0')}`;
            
            const date = new Date(dayData.date);
            const formattedTimestamp = createFormattedTimestamp(date, baseHour, baseMinute % 60);
            timestamp = formattedTimestamp.timestamp;
          }

          return {
            emoji: mood.emoji,
            text: mood.text,
            time,
            timestamp
          };
        });

        // Combinar con estados de ánimo existentes
        const allMoods = [...existingMoods, ...newMoods];

        // Guardar en Firestore
        const dailyMood: DailyMood = {
          id: docId,
          userId: user.uid,
          date: dayData.date,
          moods: allMoods
        };

        await setDoc(moodRef, dailyMood);
        importedCount += newMoods.length;
      }

      toast.success(`Se importaron ${importedCount} estados de ánimo correctamente`);
      setJsonText('');
      setIsOpen(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al importar estados de ánimo';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const exampleJson = `[
  {
    "date": "2024-01-15",
    "moods": [
      {
        "emoji": "😊",
        "text": "Feliz",
        "time": "09:30"
      },
      {
        "emoji": "😌",
        "text": "Tranquilo",
        "hour": 14,
        "minute": 15
      },
      {
        "emoji": "🤔",
        "text": "Pensativo"
      }
    ]
  }
]`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar Estados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Estados de Ánimo desde JSON</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Pegue el JSON con los estados de ánimo a importar. El campo "time" es opcional.
            </p>
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">Ver ejemplo de formato</summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                {exampleJson}
              </pre>
            </details>
          </div>

          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Pegue aquí el JSON con los estados de ánimo..."
            className="min-h-[200px] font-mono text-sm"
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!jsonText.trim() || isImporting}
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
