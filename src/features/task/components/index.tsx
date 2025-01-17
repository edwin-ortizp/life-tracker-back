// src/features/task/components/index.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { TaskInput } from './TaskInput';
import { TaskList } from './TaskList';
import { useTaskData } from '../hooks/useTaskData';
import type { TaskProps } from '../types';

// Exports
export * from './TaskInput';
export * from './TaskList';

// Main component
export const Task: React.FC<TaskProps> = () => {
  const { user } = useAuth();
  const {
    tasks,
    status,
    error,
    addTask,
    toggleTask,
    deleteTask
  } = useTaskData();

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para gestionar tus tareas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-medium text-lg">Tareas Pendientes</h3>
          {status === 'saving' && (
            <span className="text-xs text-blue-500">Guardando...</span>
          )}
        </div>

        <TaskInput
          onAdd={addTask}
          disabled={status === 'saving'}
        />

        <TaskList
          tasks={tasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Task;