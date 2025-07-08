import React from 'react';
import {
  startOfDay,
  endOfDay,
  addDays,
  isBefore
} from 'date-fns';
import { Task, TimeOfDay, TIME_OF_DAY_LABELS } from '../types';
import { TaskItemCalendar } from './TaskItemCalendar';
import { UnassignedTaskItem } from './UnassignedTaskItem';

interface TaskWeeklyCalendarProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onAssignTimeOfDay: (id: string, slot: TimeOfDay) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
}

const slots: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

export const TaskWeeklyCalendar: React.FC<TaskWeeklyCalendarProps> = ({ tasks, onDelete, onEdit, onView, onAssignTimeOfDay, onMove }) => {
  const today = startOfDay(new Date());
  const endToday = endOfDay(today);
  const tomorrow = addDays(today, 1);
  const endTomorrow = endOfDay(tomorrow);

  const byColumn: Record<'overdue' | 'today' | 'tomorrow' | 'future', Record<TimeOfDay, Task[]>> = {
    overdue: { morning: [], afternoon: [], evening: [] },
    today: { morning: [], afternoon: [], evening: [] },
    tomorrow: { morning: [], afternoon: [], evening: [] },
    future: { morning: [], afternoon: [], evening: [] }
  };

  const unassigned: Task[] = [];

  tasks.forEach(t => {
    if (!t.dueDate) {
      unassigned.push(t);
      return;
    }

    if (!t.timeOfDay) {
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
      byColumn.future[t.timeOfDay].push(t);
    }
  });

  // Filter unassigned tasks to only show those without timeOfDay
  const unassignedWithoutTimeOfDay = unassigned.filter(t => !t.timeOfDay);

  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="flex gap-3 min-w-fit pb-2">
        {(
          [
            { key: 'overdue', label: 'Vencidas' },
            { key: 'today', label: 'Hoy' },
            { key: 'tomorrow', label: 'Mañana' },
            { key: 'future', label: 'Futuras' }
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="w-[500px] flex-shrink-0 space-y-2">
            <div className="text-center text-sm font-medium sticky top-0 bg-white py-1 z-10">{label}</div>
            {slots.map((slot) => (
              <div key={slot} className="min-h-[6rem] border rounded p-2 space-y-1 bg-white">
                <div className="text-xs font-semibold text-gray-500">
                  {TIME_OF_DAY_LABELS[slot]}
                </div>
                {byColumn[key][slot].map((task) => (
                  <TaskItemCalendar
                    key={task.id}
                    task={task}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onView={onView}
                    onMove={onMove}
                    onAssignTimeOfDay={onAssignTimeOfDay}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
        {unassignedWithoutTimeOfDay.length > 0 && (
          <div className="w-[500px] flex-shrink-0 space-y-2">
            <h3 className="text-sm font-medium text-center sticky top-0 bg-white py-1 z-10">Sin asignar</h3>
            <div className="min-h-[6rem] border rounded p-2 space-y-1 bg-white">
              {unassignedWithoutTimeOfDay.map((task) => (
                <UnassignedTaskItem
                  key={task.id}
                  task={task}
                  onView={onView}
                  onAssign={onAssignTimeOfDay}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskWeeklyCalendar;
