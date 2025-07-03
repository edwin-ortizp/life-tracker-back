import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TaskExecution } from '@/features/task/components/TaskExecution';

const TaskRunPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div className="p-4">Tarea no encontrada</div>;
  }

  return <TaskExecution taskId={id} onBack={() => navigate(-1)} />;
};

export default TaskRunPage;
