// src/modules/task/components/index.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { TaskList } from './TaskList';
import { adjustEndDateToStartDate } from '@/shared/utils/dates';
import type { TaskProps } from '../models';

// Exports
export * from './TaskKanban';
export * from './TaskList';
export * from './TaskDetailsModal';
export * from './PriorityLegend';
export * from './PrivateTaskSection';
export * from './TaskAiSuggestion';
export * from './TaskAiMenu';
export * from './TaskAiBreakdown';
export * from './TaskAiImproveDescription';
export * from './TaskAiIdeas';
export * from './TaskAiReprioritize';
export * from './AiLoadingBar';
export * from './TaskEstimatedTimeInput';
export * from "./TaskTimeOfDaySelect";
export * from "./TaskWeeklyCalendar";
export * from "./TaskWeekView";
export * from "./TaskKanbanView";
export * from "./UnassignedTaskItem";
export * from "./TaskDateTimeRangeInput";
export * from "./TasksOverdue";
export * from "./TasksTodayCalendar";
export * from "./TasksFuture";
export * from "./TasksNoDate";
export * from "./TaskCalendarCompact";
import { RecurrenceModal } from './RecurrenceModal';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useTaskData } from '../controllers/useTaskData.supabase';
import { useTaskKeyboardShortcuts } from '../controllers/useTaskKeyboardShortcuts';

export const Task: React.FC<TaskProps> = ({ showFloatingButton = false }) => {
  const { user } = useAuth();
  const taskData = useTaskData();
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
  } = taskData;

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);

  // Initialize global keyboard shortcuts for task module
  useTaskKeyboardShortcuts({
    openCreateModal,
    isModalOpen: showRecurrenceModal || showDetailModal
  });


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
        <CardContent className="pt-6">
          <div className="space-y-6">
            <TaskList
              tasks={tasks}
              onDelete={deleteTask}
              onEdit={openEditModal}
              onView={(task) => { setDetailTask(task); setShowDetailModal(true); }}
              onMove={(id, startDate) => {
                // Encontrar la tarea actual para obtener sus fechas originales
                const task = tasks.find(t => t.id === id);
                if (!task) return;

                // Si se está quitando la fecha (startDate es null)
                if (!startDate) {
                  editTask(id, { startDate: undefined, endDate: undefined });
                  return;
                }

                // Calcular la nueva endDate preservando la duración original
                const newEndDate = adjustEndDateToStartDate(
                  task.startDate,
                  task.endDate,
                  startDate
                );

                // Actualizar ambas fechas
                editTask(id, {
                  startDate,
                  endDate: newEndDate
                });
              }}
              onAssignTimeOfDay={(id, timeOfDay) => editTask(id, { timeOfDay })}
              status={status}
              error={error}
            />

            {error && (
              <div className="text-sm text-red-500 p-2">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botón flotante para móviles (estilo Material Design) - Solo en páginas dedicadas */}
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

export default Task;
