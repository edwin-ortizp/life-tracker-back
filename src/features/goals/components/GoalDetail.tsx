import { useState } from 'react';
import type { Goal } from '../types';

interface Props {
  goal: Goal;
  onAddTask: (title: string) => void;
  onToggleTask: (index: number) => void;
  onAddEntry: (text: string, date: string, isMilestone: boolean) => void;
  onIncrementPositive: () => void;
  onIncrementNegative: () => void;
}

export const GoalDetail = ({ goal, onAddTask, onToggleTask, onAddEntry, onIncrementPositive, onIncrementNegative }: Props) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [milestone, setMilestone] = useState(false);

  return (
    <div className="space-y-4 mt-4">
      <div>
        <h3 className="text-lg font-medium mb-1">{goal.title}</h3>
        {goal.description && <p className="text-sm text-gray-600 mb-2">{goal.description}</p>}
        <p className="text-xs capitalize mb-2">Estado: {goal.status}</p>
        <div className="flex gap-4 mt-2">
          <button onClick={onIncrementPositive} className="flex items-center gap-1 text-green-600">
            <span role="img" aria-label="positivo">👍</span> {goal.positiveCount ?? 0}
          </button>
          <button onClick={onIncrementNegative} className="flex items-center gap-1 text-red-600">
            <span role="img" aria-label="negativo">👎</span> {goal.negativeCount ?? 0}
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Tareas</h4>
        <ul className="space-y-1 mb-2">
          {goal.tasks.map((t, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <input type="checkbox" checked={t.done} onChange={() => onToggleTask(idx)} />
              <span className={t.done ? 'line-through' : ''}>{t.title}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={taskTitle}
            onChange={e => setTaskTitle(e.target.value)}
            className="border rounded p-1 text-sm flex-1"
            placeholder="Nueva tarea"
          />
          <button
            onClick={() => {
              if (taskTitle.trim()) {
                onAddTask(taskTitle.trim());
                setTaskTitle('');
              }
            }}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            Agregar
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Avances</h4>
        <ul className="space-y-1 mb-2">
          {goal.entries.map((e, idx) => (
            <li key={idx} className="text-sm">
              <span className="text-xs text-gray-500 mr-2">{new Date(e.date).toLocaleDateString()}</span>
              {e.text} {e.isMilestone && '⭐'}
            </li>
          ))}
        </ul>
        <textarea
          value={entryText}
          onChange={e => setEntryText(e.target.value)}
          className="border rounded p-1 w-full text-sm mb-2"
          placeholder="Nuevo avance"
        />
        <div className="flex items-center gap-2 mb-2">
          <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="border rounded p-1 text-sm" />
          <label className="text-sm flex items-center gap-1">
            <input type="checkbox" checked={milestone} onChange={e => setMilestone(e.target.checked)} />
            Hito
          </label>
        </div>
        <button
          onClick={() => {
            if (entryText.trim()) {
              onAddEntry(entryText.trim(), entryDate, milestone);
              setEntryText('');
              setEntryDate('');
              setMilestone(false);
            }
          }}
          className="px-2 py-1 bg-green-600 text-white rounded"
        >
          Registrar avance
        </button>
      </div>
    </div>
  );
};
