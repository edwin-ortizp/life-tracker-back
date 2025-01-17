import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, BarChart3 } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  doc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

const Habit = () => {
  const [view, setView] = useState('weekly');
  const [habits] = useState([
    { id: 1, name: 'Ejercicio', icon: '🏋️', timeOfDay: 'morning', goal: '30 min' },
    { id: 2, name: 'Meditación', icon: '🧘', timeOfDay: 'morning', goal: '10 min' },
    { id: 3, name: 'Lectura', icon: '📚', timeOfDay: 'anytime', goal: '20 min' },
    { id: 4, name: 'Programación', icon: '💻', timeOfDay: 'afternoon', goal: '3+ hrs' },
    { id: 5, name: 'Duolingo', icon: '🗣️', timeOfDay: 'anytime', goal: '15 min' }
  ]);
  const [completedHabits, setCompletedHabits] = useState<{ [key: string]: boolean }>({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const currentYear = new Date().getFullYear();
    const docRef = doc(db, 'habits', `${user.uid}_${currentYear}`);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setCompletedHabits(doc.data().habits || {});
          setStatus('saved');
        } else {
          setCompletedHabits({});
          setStatus('idle');
        }
      },
      (error) => {
        if (error instanceof Error) {
          setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } else {
          setError('An unknown error occurred');
        }
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const toggleHabit = async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const year = new Date().getFullYear();
    const key = `${habitId}_${date}`;
    const newCompleted = {
      ...completedHabits,
      [key]: !completedHabits[key]
    };
    
    const docRef = doc(db, 'habits', `${user.uid}_${year}`);

    try {
      await setDoc(docRef, {
        userId: user.uid,
        year,
        habits: newCompleted,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatus('saved');
    } catch (error) {
      setError(error.message);
      setStatus('error');
    }
  };

  const getColor = (habitId: number): string => {
    const colors: { [key: number]: string } = {
      1: 'bg-green-500',
      2: 'bg-blue-500',
      3: 'bg-amber-500',
      4: 'bg-teal-500',
      5: 'bg-purple-500'
    };
    return colors[habitId] || 'bg-gray-500';
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const week = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - day + i);
      week.push({
        dayName: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][date.getDay()],
        fullDate: date.toISOString().split('T')[0]
      });
    }
    
    return week;
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tus hábitos</p>
        </CardContent>
      </Card>
    );
  }

  const weekDays = getWeekDays();
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    return {
      name: new Date(currentYear, i).toLocaleString('es', { month: 'short' }),
      days: getDaysInMonth(currentYear, i)
    };
  });

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-medium text-lg">Hábitos</h3>
          <div className="flex gap-2">
            <Button 
              variant={view === 'weekly' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('weekly')}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Semanal</span>
            </Button>
            <Button 
              variant={view === 'graph' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('graph')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Anual</span>
            </Button>
          </div>
        </div>

        {view === 'weekly' ? (
          <div className="grid grid-cols-[1fr_repeat(7,40px)] gap-2">
            <div></div>
            {weekDays.map(day => (
            <div key={day.fullDate} className="text-center">
                <div className="font-medium">{day.dayName}</div>
                <div className="text-[10px] text-gray-400">{day.fullDate.split('-').slice(1).join('/')}</div>
            </div>
            ))}
            
            {habits.map(habit => (
              <React.Fragment key={habit.id}>
                <div className="flex items-center gap-2">
                  <span>{habit.icon}</span>
                  <div className="flex flex-col">
                    <span>{habit.name}</span>
                    <span className="text-xs text-gray-500">{habit.goal}</span>
                  </div>
                </div>
                {weekDays.map((day) => (
                <button
                    key={`${habit.id}_${day.fullDate}`}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-colors
                    ${completedHabits[`${habit.id}_${day.fullDate}`] 
                        ? getColor(habit.id)
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleHabit(habit.id, day.fullDate)}
                    disabled={status === 'saving'}
                >
                    {completedHabits[`${habit.id}_${day.fullDate}`] && 
                    <CheckCircle className="w-5 h-5 text-white" />
                    }
                </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="space-y-6 overflow-x-auto">
            {habits.map((habit) => (
              <div key={habit.id} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{habit.icon}</span>
                  <span className="font-medium">{habit.name}</span>
                  <span className="text-sm text-gray-500">{habit.goal}</span>
                </div>
                <div className="grid grid-cols-12 gap-1 min-w-[800px]">
                  {months.map((month, monthIndex) => (
                    <div key={month.name} className="space-y-1">
                      <div className="text-xs text-gray-500 mb-1">{month.name}</div>
                      <div className="grid grid-cols-7 gap-px">
                        {Array.from({ length: month.days }, (_, day) => {
                          const date = new Date(currentYear, monthIndex, day + 1)
                            .toISOString()
                            .split('T')[0];
                          const isCompleted = completedHabits[`${habit.id}_${date}`];
                          
                          return (
                            <button
                              key={date}
                              onClick={() => toggleHabit(habit.id, date)}
                              className={`w-full aspect-square rounded-sm ${
                                isCompleted 
                                  ? `${getColor(habit.id)} opacity-75 hover:opacity-100` 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}

        {status === 'saving' && (
          <p className="mt-4 text-sm text-blue-500">
            Guardando...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Habit;