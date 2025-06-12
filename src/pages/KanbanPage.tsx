import { Plus } from 'lucide-react';
import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskKanban, TaskDetailsModal, TaskAiMenu } from '@/features/task/components';
import { PriorityLegend } from '@/features/task/components/PriorityLegend';
import { RecurrenceModal } from '@/features/task/components/RecurrenceModal';
import { useTaskData } from '@/features/task/hooks/useTaskData';
import type { Task } from '@/features/task/types';

const KanbanPage = () => {
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
    openEditModal,
    openCreateModal
  } = useTaskData();

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Inicia sesión para gestionar tus tareas</h2>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tablero Kanban</h1>
        <p className="text-gray-500">Organiza tus tareas en un tablero estilo Trello</p>
      </div>      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tareas</CardTitle>            <div className="flex items-center gap-4">
              {status === 'saving' && (
                <span className="text-xs text-blue-500">Guardando...</span>
              )}              <div className="flex items-center gap-2">
                <TaskAiMenu tasks={tasks} />
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
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={openEditModal}
            onView={(task) => { setDetailTask(task); setShowDetailModal(true); }}
            onMove={(id, due) => editTask(id, { dueDate: due ?? undefined })}
            onAdd={(due) => openCreateModal(due ?? undefined)}
          />
          {error && (
            <p className="text-sm text-red-500 mt-4">
              {error}
            </p>
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
        onToggle={(id, c) => toggleTask(id, c)}
      />
      <PriorityLegend />
    </PageLayout>
  );
};

export default KanbanPage;
