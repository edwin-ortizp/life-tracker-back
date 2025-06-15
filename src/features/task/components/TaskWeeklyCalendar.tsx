import React from 'react';
import { getWeekDays } from '@/features/meal/utils/dateUtils';
import { getLocalDateString } from '@/utils/dates';
import { Task, TimeOfDay, TIME_OF_DAY_LABELS } from '../types';
import { TaskItem } from './TaskItem';

interface TaskWeeklyCalendarProps {
  tasks: Task[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
}

const slots: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

export const TaskWeeklyCalendar: React.FC<TaskWeeklyCalendarProps> = ({ tasks, onToggle, onDelete, onEdit, onView }) => {
  const week = getWeekDays(new Date());
  const byDay: Record<string, Record<TimeOfDay, Task[]>> = {};
  week.forEach(d => {
    byDay[d.fullDate] = { morning: [], afternoon: [], evening: [] };
  });
  const unassigned: Task[] = [];
  tasks.forEach(t => {
    if (!t.dueDate || !t.timeOfDay) {
      unassigned.push(t);
      return;
    }
    const dateStr = getLocalDateString(t.dueDate);
    if (byDay[dateStr]) {
      byDay[dateStr][t.timeOfDay].push(t);
    } else {
      unassigned.push(t);
    }
  });

  return (
    <div className="flex gap-4">
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[700px] grid grid-cols-7 gap-2">
          {week.map(day => (
            <div key={day.fullDate} className="space-y-2">
              <div className="text-center text-sm font-medium">{day.dayName} {day.fullDate.slice(5)}</div>
              {slots.map(slot => (
                <div key={slot} className="min-h-[6rem] border rounded p-1 space-y-1">
                  <div className="text-xs font-semibold text-gray-500">
                    {TIME_OF_DAY_LABELS[slot]}
                  </div>
                  {byDay[day.fullDate][slot].map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggle}
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
          {unassigned.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onView={onView}
              variant="list"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskWeeklyCalendar;
