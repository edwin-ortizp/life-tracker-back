import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskKanban, TaskDetailsModal, TaskAiMenu } from './index';
import { PriorityLegend } from './PriorityLegend';
import { RecurrenceModal } from './RecurrenceModal';
import { useTaskData } from '../hooks/useTaskData';
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
    deleteTask,
    completeRecurrentTask,
    setShowRecurrenceModal,
    openEditModal,
    openCreateModal
  } = useTaskData();

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState<Task[]>([]);

  return (
    <div className="space-y-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tablero Kanban</CardTitle>
            <div className="flex items-center gap-4">
              {status === 'saving' && (
                <span className="text-xs text-blue-500">Guardando...</span>
              )}
              <div className="flex items-center gap-2">
                <TaskAiMenu tasks={visibleTasks} onUpdate={(id, u) => editTask(id, u)} />
                <Button onClick={() => openCreateModal()} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Tarea
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
            onFilteredTasksChange={setVisibleTasks}
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
        onEdit={(t) => {
          setShowDetailModal(false);
          openEditModal(t);
        }}
      />
      <PriorityLegend />
    </div>
  );
};

export default TaskKanbanView;
