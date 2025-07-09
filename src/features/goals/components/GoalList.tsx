import type { Goal } from '../types';

interface Props {
  goals: Goal[];
  onSelect: (id: string) => void;
}

export const GoalList = ({ goals, onSelect }: Props) => {
  if (goals.length === 0) {
    return <p className="text-sm text-gray-500">No hay objetivos</p>;
  }

  return (
    <div className="space-y-2">
      {goals.map(goal => {
        const completed = goal.tasks.filter(t => t.done).length;
        const total = goal.tasks.length;
        return (
          <button
            key={goal.id}
            onClick={() => onSelect(goal.id)}
            className="w-full text-left border rounded-lg p-3 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{goal.title}</span>
              <span className="text-xs capitalize">{goal.status}</span>
            </div>
            <p className="text-xs text-gray-600">
              {completed}/{total} tareas completadas
            </p>
          </button>
        );
      })}
    </div>
  );
};
