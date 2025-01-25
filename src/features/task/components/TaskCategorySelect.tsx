// src/features/task/components/TaskCategorySelect.tsx
import React from 'react';
import { Tag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_CATEGORIES, CATEGORY_LABELS, TaskCategory } from '../types';

interface TaskCategorySelectProps {
  value: TaskCategory;
  onChange: (category: TaskCategory) => void;
}

export const TaskCategorySelect: React.FC<TaskCategorySelectProps> = ({ value, onChange }) => {
  // Convertir TASK_CATEGORIES a array para facilitar el mapeo
  const categories = Object.values(TASK_CATEGORIES);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Categoría
      </label>
      <Select
        value={value}
        onValueChange={(newValue) => onChange(newValue as TaskCategory)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una categoría">
            {CATEGORY_LABELS[value]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};