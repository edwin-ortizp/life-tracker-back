import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useTaskData } from '../hooks/useTaskData.supabase';
import { useTaskKeyboardShortcuts } from '../hooks/useTaskKeyboardShortcuts';
import { TaskWeeklyCalendar } from './TaskWeeklyCalendar';
import { RecurrenceModal } from './RecurrenceModal';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { Task } from '../types';

export const TaskWeekView: React.FC = () => {
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
  } = useTaskData();
  const { isOnline } = useNetworkStatus();

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Initialize global keyboard shortcuts for task module
  useTaskKeyboardShortcuts({
    openCreateModal,
    isModalOpen: showRecurrenceModal || showDetailModal
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardContent>
          <TaskWeeklyCalendar
            tasks={tasks}
            onDelete={deleteTask}
            onEdit={openEditModal}
            onMove={(id, startDate) => editTask(id, { startDate: startDate || undefined })}
            onView={(t) => { setDetailTask(t); setShowDetailModal(true); }}
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
          taskCode: 0,
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
        onEdit={(t) => { setShowDetailModal(false); openEditModal(t); }}
        onToggle={toggleTask}
      />
    </div>
  );
};

export default TaskWeekView;
