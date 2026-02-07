import React from 'react';
import { Task } from '../models';
import { TaskItemList } from './TaskItemList';
import { Card, CardContent } from '@/shared/components/ui/card';

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
  onAssignTimeOfDay?: (taskId: string, timeOfDay: any) => void;
}

export const TaskGroup: React.FC<TaskGroupProps> = ({ 
  title, 
  tasks, 
  onDelete,
  onEdit,
  onView,
  onMove,
  onAssignTimeOfDay
}) => {
  if (tasks.length === 0) return null;

  const priorityOrder: Record<string, number> = {
    do: 0,
    decide: 1,
    delegate: 2,
    delete: 3,
  };

  // Ordenar tareas por prioridad y luego por fecha
  const sortedTasks = tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority || 'none'] ?? 4;
    const pb = priorityOrder[b.priority || 'none'] ?? 4;
    if (pa !== pb) return pa - pb;
    if (a.startDate && b.startDate) {
      return a.startDate.getTime() - b.startDate.getTime();
    }
    if (!a.startDate && !b.startDate) {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    }
    return a.startDate ? -1 : 1;
  });

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider pt-4">
        {title}
      </h3>
      
      {/* Desktop Table with Headers */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
              <div className="col-span-4">Tarea</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-1 text-center">Prioridad</div>
              <div className="col-span-1 text-center">Tiempo</div>
              <div className="col-span-2 text-center">Fecha</div>
              <div className="col-span-2 text-center">Acciones</div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-gray-100">
              {sortedTasks.map(task => (
                <TaskItemList
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
          </CardContent>
        </Card>
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedTasks.map(task => (
          <TaskItemList
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
    </div>
  );
};