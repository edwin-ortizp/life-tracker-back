import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Droplet, 
  Coffee, 
  Glasses,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  doc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

const DRINKS = {
  water: { 
    name: 'Agua', 
    icon: Droplet, 
    hydrationFactor: 1,
    color: 'text-blue-500',
    amounts: [100, 200, 300]
  },
  milk: { 
    name: 'Leche', 
    icon: Glasses,
    hydrationFactor: 0.9,
    color: 'text-gray-500',
    amounts: [100, 200, 300]
  },
  tea: {
    name: 'Té',
    icon: Coffee,
    hydrationFactor: 0.85,
    color: 'text-amber-600',
    amounts: [100, 200, 300]
  },
  coffee: { 
    name: 'Café', 
    icon: Coffee, 
    hydrationFactor: 0.8,
    color: 'text-amber-800',
    amounts: [100, 200, 300]
  },
  juice: {
    name: 'Jugo',
    icon: Glasses,
    hydrationFactor: 0.85,
    color: 'text-orange-500',
    amounts: [100, 200, 300]
  }
};

interface Drink {
  type: keyof typeof DRINKS;
  amount: number;
  hydration: number;
  timestamp: string;
  time: string;
}

interface WaterProps {
  selectedDate: Date;
}

const Water = ({ selectedDate }: WaterProps) => {
  const [intake, setIntake] = useState(0);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const goal = 2000;

  useEffect(() => {
    if (!user) return;

    const dateString = selectedDate.toISOString().split('T')[0];
    const docRef = doc(db, 'water', `${user.uid}_${dateString}`);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIntake(data.totalHydration || 0);
          setDrinks(data.drinks || []);
          setStatus('saved');
        } else {
          setIntake(0);
          setDrinks([]);
          setStatus('idle');
        }
      },
      (error) => {
        console.error('Error en snapshot:', error);
        setError(error.message);
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate]);

  const addDrink = async (type: keyof typeof DRINKS, amount: number) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);

      const newDrink = {
        type,
        amount,
        hydration: amount * DRINKS[type].hydrationFactor,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };

      const updatedDrinks = [...drinks, newDrink];
      const totalHydration = updatedDrinks.reduce((sum, drink) => 
        sum + drink.hydration, 0
      );

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalHydration,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSelectedDrink(null);
      setStatus('saved');
    } catch (error) {
      console.error('Error al añadir bebida:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const deleteDrink = async (index: number) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);
      
      const updatedDrinks = drinks.filter((_, i) => i !== index);
      const totalHydration = updatedDrinks.reduce(
        (sum, drink) => sum + drink.hydration, 
        0
      );

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalHydration,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatus('saved');
    } catch (error) {
      console.error('Error al eliminar bebida:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const getMotivationalMessage = () => {
    const percentage = (intake/goal) * 100;
    if (percentage >= 100) return "¡Excelente! Has alcanzado tu meta diaria 🎉";
    if (percentage >= 75) return "¡Vas muy bien! Ya casi llegas a tu meta 💪";
    if (percentage >= 50) return "¡A mitad de camino! Sigue así 🌊";
    if (percentage >= 25) return "¡Buen comienzo! Mantén el ritmo 💧";
    return "¡Comienza tu día con buena hidratación! 🚰";
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tu hidratación</p>
        </CardContent>
      </Card>
    );
  }

  const isCurrentDate = selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-lg flex items-center gap-2">
            <Droplet className="w-5 h-5" />
            Hidratación
          </h3>
          <div className="text-right">
            <div className={intake > goal ? 'text-blue-500 font-medium' : ''}>
              {intake}ml / {goal}ml
            </div>
            <div className="text-xs text-gray-500">
              {intake > goal ? `+${intake - goal}ml extra` : ''}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Progress 
            value={Math.min((intake/goal)*100, 100)} 
            className={`h-3 ${intake > goal ? 'bg-blue-200' : ''}`}
          />
          <p className="text-sm text-gray-600 mt-2 text-center">
            {getMotivationalMessage()}
          </p>
        </div>

        {isCurrentDate && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(DRINKS).map(([key, drink]) => {
              const Icon = drink.icon;
              return (
                <div key={key} className="relative">
                  <Button
                    variant="outline"
                    className="w-full h-12 flex items-center justify-center gap-2"
                    onClick={() => setSelectedDrink(selectedDrink === key ? null : key)}
                    disabled={status === 'saving'}
                  >
                    <Icon className={`w-4 h-4 ${drink.color}`} />
                    <span className="text-sm">{drink.name}</span>
                  </Button>
                  {selectedDrink === key && (
                    <div className="absolute top-full left-0 w-full z-10 bg-white shadow-lg rounded-md mt-1 p-1">
                      {drink.amounts.map(amount => (
                        <Button
                          key={amount}
                          variant="ghost"
                          className="w-full text-sm justify-between"
                          onClick={() => addDrink(key as keyof typeof DRINKS, amount)}
                        >
                          {amount}ml
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? (
            <ChevronUp className="w-4 h-4 mr-2" />
          ) : (
            <ChevronDown className="w-4 h-4 mr-2" />
          )}
          Historial de hoy
        </Button>

        {showHistory && drinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {drinks.map((drink, index) => {
              const drinkInfo = DRINKS[drink.type];
              const Icon = drinkInfo.icon;
              return (
                <div 
                  key={drink.timestamp}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 group"
                >
                  <Icon className={`w-4 h-4 ${drinkInfo.color}`} />
                  <span className="font-medium">{drinkInfo.name}</span>
                  <span className="text-gray-500">{drink.amount}ml</span>
                  <span className="text-xs text-gray-400 ml-auto">{drink.time}</span>
                  {isCurrentDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteDrink(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showHistory && drinks.length === 0 && (
          <div className="mt-4 text-center text-gray-500 text-sm py-4">
            No hay registros para este día
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Water;