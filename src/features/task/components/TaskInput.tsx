// src/features/task/components/TaskInput.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { TASK_CATEGORIES, TaskFormData, TaskCategory } from '../types';

interface TaskInputProps {
  onAdd: (data: TaskFormData) => void;
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  personal: 'Personal',
  work: 'Trabajo',
  home: 'Casa',
  health: 'Salud',
  shopping: 'Compras',
  study: 'Estudio',
  social: 'Social',
  other: 'Otro'
};

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd, disabled }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('personal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd({ 
        title: title.trim(),
        category 
      });
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nueva tarea..."
            disabled={disabled}
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as TaskCategory)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TASK_CATEGORIES).map(([key, value]) => (
              <SelectItem key={value} value={value}>
                {CATEGORY_LABELS[value as TaskCategory]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="icon" disabled={disabled}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};