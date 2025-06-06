// src/features/task/components/index.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TaskList } from './TaskList';


// Exports
export * from './TaskKanban';
export * from './TaskList';
export * from './TaskDetailsModal';
export * from './PriorityLegend';
export * from './PrivateTaskSection';
import { RecurrenceModal } from './RecurrenceModal';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useTaskData } from '../hooks/useTaskData';
import type { TaskProps, Task as TaskType } from '../types';

export const Task: React.FC<TaskProps> = ({ showFloatingButton = false }) => {
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

  const [detailTask, setDetailTask] = useState<TaskType | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Inicia sesión para gestionar tus tareas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 relative">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tareas Pendientes</CardTitle>
            <div className="hidden md:flex items-center gap-4">
              {status === 'saving' && (
                <span className="text-xs text-blue-500">Guardando...</span>
              )}
              <Button onClick={() => openCreateModal()} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
            {/* Solo mostrar estado en móvil */}
            <div className="md:hidden">
              {status === 'saving' && (
                <span className="text-xs text-blue-500">Guardando...</span>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <TaskList
              tasks={tasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={openEditModal}
              onView={(task) => { setDetailTask(task); setShowDetailModal(true); }}
            />

            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>      {/* Botón flotante para móviles (estilo Material Design) - Solo en páginas dedicadas */}
      {showFloatingButton && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => openCreateModal()}
            size="lg"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 active:scale-95 border-0 flex items-center justify-center text-white"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

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

export default Task;
