import { useMemo } from 'react';
import { useTaskData } from '@/features/task/hooks/useTaskData.supabase';

export const useGoalTasks = (goalId: string) => {
  const { allTasks, addTask, editTask, toggleTask, deleteTask } = useTaskData();

  const goalTasks = useMemo(() =>
    allTasks.filter(task => task.goalId === goalId),
    [allTasks, goalId]
  );

  const addGoalTask = async (formData: any) => {
    await addTask({ ...formData, goalId });
  };

  return {
    tasks: goalTasks,
    addTask: addGoalTask,
    editTask,
    toggleTask,
    deleteTask
  };
};
