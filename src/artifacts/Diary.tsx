import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, Save } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { 
  doc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

const Diary = ({ selectedDate }) => {
  const [entry, setEntry] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    const docRef = doc(db, 'diary', `${user.uid}_${dateString}`);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setEntry(doc.data().text || '');
          setStatus('saved');
        } else {
          setEntry('');
          setStatus('idle');
        }
      },
      (error) => {
        setError(error.message);
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate]);

  const saveEntry = async () => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);
    const docRef = doc(db, 'diary', `${user.uid}_${dateString}`);

    try {
      await setDoc(docRef, {
        userId: user.uid,
        text: entry,
        date: dateString,
        lastUpdated: serverTimestamp(),
        displayTime: new Date().toLocaleString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        })
      }, { merge: true });

      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para usar el diario</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            <span className="font-medium">Mi Diario</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </span>
            {status === 'saving' && (
              <span className="text-sm text-blue-500">Guardando...</span>
            )}
            {status === 'saved' && (
              <span className="text-sm text-green-500">Guardado</span>
            )}
            {status === 'error' && (
              <span className="text-sm text-red-500">
                Error al guardar
              </span>
            )}
          </div>
        </div>
        <textarea
        value={entry}
        onChange={(e) => {
            setEntry(e.target.value);
            setStatus('idle');
        }}
        placeholder="¿Cómo ha sido tu día?"
        className="w-full h-64 p-4 border rounded resize-none focus:ring-2 focus:ring-blue-500"
        />
        <Button 
          onClick={saveEntry} 
          className="w-full"
          disabled={status === 'saving'}
        >
          {status === 'saving' ? (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4 animate-spin" />
              Guardando...
            </span>
          ) : (
            'Guardar entrada'
          )}
        </Button>
        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Diary;