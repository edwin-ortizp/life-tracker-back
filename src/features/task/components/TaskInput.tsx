// src/features/task/components/TaskInput.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TaskInputProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd, disabled }) => {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAdd(newTask);
      setNewTask('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <Input
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Nueva tarea..."
        className="flex-1"
        disabled={disabled}
      />
      <Button type="submit" size="icon" disabled={disabled}>
        <Plus className="w-4 h-4" />
      </Button>
    </form>
  );
};