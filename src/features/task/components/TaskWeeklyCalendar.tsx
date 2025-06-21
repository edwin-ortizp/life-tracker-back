import React from 'react';
import {
  startOfDay,
  endOfDay,
  addDays,
  isBefore
} from 'date-fns';
import { Task, TimeOfDay, TIME_OF_DAY_LABELS } from '../types';
import { TaskItem } from './TaskItem';
import { UnassignedTaskItem } from './UnassignedTaskItem';

interface TaskWeeklyCalendarProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onAssignTimeOfDay: (id: string, slot: TimeOfDay) => void;
}

const slots: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

export const TaskWeeklyCalendar: React.FC<TaskWeeklyCalendarProps> = ({ tasks, onDelete, onEdit, onView, onAssignTimeOfDay }) => {
  const today = startOfDay(new Date());
  const endToday = endOfDay(today);
  const tomorrow = addDays(today, 1);
  const endTomorrow = endOfDay(tomorrow);

  const byColumn: Record<'overdue' | 'today' | 'tomorrow', Record<TimeOfDay, Task[]>> = {
    overdue: { morning: [], afternoon: [], evening: [] },
    today: { morning: [], afternoon: [], evening: [] },
    tomorrow: { morning: [], afternoon: [], evening: [] }
  };

  const unassigned: Task[] = [];

  tasks.forEach(t => {
    if (!t.dueDate || !t.timeOfDay) {
      unassigned.push(t);
      return;
    }

    if (isBefore(t.dueDate, today)) {
      byColumn.overdue[t.timeOfDay].push(t);
    } else if (isBefore(t.dueDate, endToday)) {
      byColumn.today[t.timeOfDay].push(t);
    } else if (isBefore(t.dueDate, endTomorrow)) {
      byColumn.tomorrow[t.timeOfDay].push(t);
    } else {
      unassigned.push(t);
    }
  });

  return (
    <div className="flex gap-4">
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[700px] grid grid-cols-3 gap-2">
          {(
            [
              { key: 'overdue', label: 'Vencidas' },
              { key: 'today', label: 'Hoy' },
              { key: 'tomorrow', label: 'Mañana' }
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="text-center text-sm font-medium">{label}</div>
              {slots.map((slot) => (
                <div key={slot} className="min-h-[6rem] border rounded p-1 space-y-1">
                  <div className="text-xs font-semibold text-gray-500">
                    {TIME_OF_DAY_LABELS[slot]}
                  </div>
                  {byColumn[key][slot].map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onView={onView}
                      variant="list"
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {unassigned.length > 0 && (
        <div className="w-56 space-y-2">
          <h3 className="text-sm font-medium">Sin asignar</h3>
          {unassigned.map((task) => (
            <UnassignedTaskItem
              key={task.id}
              task={task}
              onView={onView}
              onAssign={onAssignTimeOfDay}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskWeeklyCalendar;
