import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useGoals } from '../hooks/useGoals';
import { GoalList } from './GoalList';
import { GoalDetail } from './GoalDetail';
import { Button } from '@/components/ui/button';

export const Goals = () => {
  const {
    goals,
    status,
    error,
    addGoal,
    addTask,
    toggleTask,
    addEntry,
    incrementPositiveCount,
    incrementNegativeCount
  } = useGoals();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const selectedGoal = goals.find(g => g.id === selectedId) || null;

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-medium text-lg mb-2">Objetivos</h3>
          <div className="flex gap-2 mb-4">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="border rounded p-1 text-sm flex-1"
              placeholder="Nuevo objetivo"
            />
            <Button
              onClick={() => {
                if (newTitle.trim()) {
                  addGoal({
                    title: newTitle.trim(),
                    status: 'active',
                    tasks: [],
                    entries: []
                  });
                  setNewTitle('');
                }
              }}
              size="sm"
            >
              Crear
            </Button>
          </div>
          <GoalList goals={goals} onSelect={setSelectedId} />
          {status === 'loading' && <p className="text-sm">Cargando...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        {selectedGoal && (
          <GoalDetail
            goal={selectedGoal}
            onAddTask={title => addTask(selectedGoal.id, title)}
            onToggleTask={idx => toggleTask(selectedGoal.id, idx)}
            onAddEntry={(text, date, milestone) => addEntry(selectedGoal.id, { text, date, isMilestone: milestone })}
            onIncrementPositive={() => incrementPositiveCount(selectedGoal.id)}
            onIncrementNegative={() => incrementNegativeCount(selectedGoal.id)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default Goals;
