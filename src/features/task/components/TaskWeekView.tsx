import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTaskData } from '../hooks/useTaskData';
import { TaskWeeklyCalendar } from './TaskWeeklyCalendar';
import { RecurrenceModal } from './RecurrenceModal';
import { TaskDetailsModal } from './TaskDetailsModal';
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
    deleteTask,
    completeRecurrentTask,
    setShowRecurrenceModal,
    openEditModal,
    openCreateModal
  } = useTaskData();

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Calendario</CardTitle>
            <div className="flex items-center gap-4">
              {status === 'saving' && (
                <span className="text-xs text-blue-500">Guardando...</span>
              )}
              <Button onClick={() => openCreateModal()} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TaskWeeklyCalendar
            tasks={tasks}
            onDelete={deleteTask}
            onEdit={openEditModal}
            onAssignTimeOfDay={(id, slot) => editTask(id, { timeOfDay: slot })}
            onView={(t) => { setDetailTask(t); setShowDetailModal(true); }}
          />
          {error && (
            <p className="text-sm text-red-500 mt-4">{error}</p>
          )}
        </CardContent>
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
        onEdit={(t) => { setShowDetailModal(false); openEditModal(t); }}
      />
    </div>
  );
};

export default TaskWeekView;
