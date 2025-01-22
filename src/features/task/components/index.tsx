// src/features/task/components/index.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { TaskInput } from './TaskInput';
import { TaskList } from './TaskList';
import { RecurrenceModal } from './RecurrenceModal';
import { useTaskData } from '../hooks/useTaskData';
import type { TaskProps } from '../types';

// Exports
export * from './TaskInput';
export * from './TaskList';
export * from './RecurrenceModal';

// Main component
export const Task: React.FC<TaskProps> = ({  }) => {
  const { user } = useAuth();
  const {
    tasks,
    status,
    error,
    showRecurrenceModal,
    currentTask,
    modalMode,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    completeRecurrentTask,
    setShowRecurrenceModal,
    openEditModal
  } = useTaskData();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Inicia sesión para gestionar tus tareas</p>
        </CardContent>
      </Card>
    );
  }

  const getDefaultNextDate = () => {
    if (!currentTask?.recurrence) return new Date();
    
    const nextDate = new Date();
    switch (currentTask.recurrence.pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'custom':
        nextDate.setDate(nextDate.getDate() + (currentTask.recurrence.customDays || 1));
        break;
    }
    return nextDate;
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tareas Pendientes</CardTitle>
            {status === 'saving' && (
              <span className="text-xs text-blue-500">Guardando...</span>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <TaskInput
              onAdd={addTask}
              disabled={status === 'saving'}
            />

            <TaskList
              tasks={tasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={openEditModal}
            />

            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {currentTask && (
        <RecurrenceModal
          isOpen={showRecurrenceModal}
          onClose={() => setShowRecurrenceModal(false)}
          onConfirm={(data) => {
            if (modalMode === 'complete') {
              completeRecurrentTask({ ...data, nextDate: getDefaultNextDate() });
            } else {
              editTask(currentTask.id, data);
            }
          }}
          task={currentTask}
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default Task;