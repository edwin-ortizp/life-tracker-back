import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  type DocumentData,
  serverTimestamp 
} from 'firebase/firestore';

interface MoodProps {
  selectedDate: Date;
}

const Mood = ({ selectedDate }: MoodProps) => {
  const [moodHistory, setMoodHistory] = useState<DocumentData[]>([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const moods = [
    { emoji: '😊', text: 'Feliz' },
    { emoji: '🌟', text: 'Energético' },
    { emoji: '😌', text: 'Tranquilo' },
    { emoji: '😴', text: 'Cansado' },
    { emoji: '🧠', text: 'Productivo' },
    { emoji: '😰', text: 'Ansioso' }
  ];

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    
    console.log('Mood - Suscribiéndose a colección moods para:', dateString);

    const q = query(
      collection(db, 'moods'),
      where('userId', '==', user.uid),
      where('date', '==', dateString)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Mood - Documentos actualizados:', snapshot.docs.map(doc => doc.data()));
        const moodEntries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMoodHistory(moodEntries);
        setStatus('saved');
      },
      (error) => {
        console.error('Mood - Error en snapshot:', error);
        setError(error.message);
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate]);

  const addMood = async (mood: { emoji: string; text: string }) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);

    try {
      console.log('Mood - Guardando:', {
        userId: user.uid,
        emoji: mood.emoji,
        text: mood.text,
        date: dateString,
      });

      await addDoc(collection(db, 'moods'), {
        userId: user.uid,
        emoji: mood.emoji,
        text: mood.text,
        date: dateString,
        timestamp: serverTimestamp(),
        time: new Date().toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });

      console.log('Mood - Guardado exitosamente');
      setStatus('saved');
    } catch (error) {
      console.error('Mood - Error al guardar:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tu estado de ánimo</p>
        </CardContent>
      </Card>
    );
  }

  const isCurrentDate = getLocalDateString(selectedDate) === getLocalDateString(new Date());

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Estado de ánimo</h3>
          {status === 'saving' && (
            <span className="text-xs text-blue-500">Guardando...</span>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-500">Error al guardar</span>
          )}
        </div>
        
        {isCurrentDate && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {moods.map((mood) => (
              <Button
                key={mood.emoji}
                variant="outline"
                onClick={() => addMood(mood)}
                className="h-12 text-lg"
                disabled={status === 'saving'}
              >
                {mood.emoji}
              </Button>
            ))}
          </div>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {moodHistory.length > 0 ? (
            moodHistory.map((entry) => (
              <div 
                key={entry.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <span className="text-xl">{entry.emoji}</span>
                <span>{entry.text}</span>
                <span className="text-gray-500 ml-auto">{entry.time}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No hay registros para este día
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Mood;