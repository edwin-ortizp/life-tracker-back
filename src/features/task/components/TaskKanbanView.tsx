import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TaskKanban, TaskDetailsModal } from './index';
import { PriorityLegend } from './PriorityLegend';
import { RecurrenceModal } from './RecurrenceModal';
import { useTaskData } from '../hooks/useTaskData.supabase';
import { useTaskKeyboardShortcuts } from '../hooks/useTaskKeyboardShortcuts';
import type { Task } from '../types';

export const TaskKanbanView: React.FC = () => {
  const {
    tasks,
    status: _status,
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

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getTaskTimeParts = (date?: Date) => {
    if (!date) {
      return { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 };
    }

    const hasTime =
      date.getHours() !== 0 ||
      date.getMinutes() !== 0 ||
      date.getSeconds() !== 0 ||
      date.getMilliseconds() !== 0;

    if (!hasTime) {
      return { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 };
    }

    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
      milliseconds: date.getMilliseconds()
    };
  };

  const buildStartDate = (task: Task, targetDate: Date) => {
    const nextStart = new Date(targetDate);
    const time = getTaskTimeParts(task.startDate);
    nextStart.setHours(time.hours, time.minutes, time.seconds, time.milliseconds);
    return nextStart;
  };

  const handleMove = (id: string, targetDate: Date | null) => {
    if (!targetDate) {
      editTask(id, { startDate: undefined });
      return;
    }

    const task = tasks.find((t) => t.id === id);
    if (!task) {
      editTask(id, { startDate: targetDate });
      return;
    }

    const newStartDate = buildStartDate(task, targetDate);
    const duration =
      task.startDate && task.endDate ? task.endDate.getTime() - task.startDate.getTime() : 0;
    const safeDuration = duration > 0 ? duration : 0;
    let newEndDate = new Date(newStartDate.getTime() + safeDuration);
    if (newEndDate.getTime() < newStartDate.getTime()) {
      newEndDate = new Date(newStartDate);
    }

    editTask(id, {
      startDate: newStartDate,
      endDate: newEndDate
    });
  };

  // Initialize global keyboard shortcuts for task module
  useTaskKeyboardShortcuts({
    openCreateModal,
    isModalOpen: showRecurrenceModal || showDetailModal
  });

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
            onMove={handleMove}
            onAdd={(due) => openCreateModal(due ?? undefined)}
            onFilteredTasksChange={() => {}}
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
