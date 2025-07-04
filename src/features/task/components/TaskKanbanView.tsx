import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskKanban, TaskDetailsModal } from './index';
import { PriorityLegend } from './PriorityLegend';
import { RecurrenceModal } from './RecurrenceModal';
import { useTaskData } from '../hooks/useTaskData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { Task } from '../types';

export const TaskKanbanView: React.FC = () => {
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
    openEditModal,
    openCreateModal,
    resync
  } = useTaskData();
  const { isOnline } = useNetworkStatus();

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  return (
    <div className="space-y-8">
      <Card className="w-full">
        <CardContent className="pt-6 overflow-x-auto">
          <TaskKanban
            tasks={tasks}
            onDelete={deleteTask}
            onEdit={openEditModal}
            onView={(task) => {
              setDetailTask(task);
              setShowDetailModal(true);
            }}
            onMove={(id, due) => editTask(id, { dueDate: due ?? undefined })}
            onAdd={(due) => openCreateModal(due ?? undefined)}
            onFilteredTasksChange={() => {}}
          />
          {error && (
            <p className="text-sm text-red-500 mt-4">{error}</p>
          )}
        </CardContent>
        <CardFooter className="justify-center gap-2 text-xs p-2">
          {status === 'saving' && (
            <span className="text-blue-500">Guardando...</span>
          )}
          {status === 'pending' && (
            <span className="text-yellow-600">Pendiente de sincronizar</span>
          )}
          {status === 'saved' && (
            <span className="text-green-600">Sincronizado</span>
          )}
          {status === 'error' && (
            <span className="text-red-600">Error de sincronización</span>
          )}
          {!isOnline && <span className="text-orange-600">Offline</span>}
          <Button onClick={resync} variant="link" className="p-0 h-auto">Reintentar</Button>
        </CardFooter>
      </Card>
      <RecurrenceModal
        isOpen={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal()}
        onConfirm={(data) => {
          if (modalMode === 'complete') {
            completeRecurrentTask(data);
          } else if (modalMode === 'edit') {
            editTask(currentTask!.id, data);
          } else {
            addTask(data);
          }
        }}
        task={currentTask || {
          id: '',
          title: '',
          completed: false,
          category: 'personal',
          createdAt: { seconds: Date.now() / 1000 }
        }}
        mode={modalMode}
      />
      <TaskDetailsModal
        task={detailTask}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={(t) => {
          setShowDetailModal(false);
          openEditModal(t);
        }}
        onToggle={toggleTask}
      />
      <PriorityLegend />
    </div>
  );
};

export default TaskKanbanView;
