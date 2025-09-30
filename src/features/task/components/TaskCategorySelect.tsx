// src/features/task/components/TaskCategorySelect.tsx
import React from 'react';
import { Tag } from 'lucide-react';
import { TASK_CATEGORIES, CATEGORY_LABELS, TaskCategory } from '../types';
import { NativeMobileSelect } from '@/components/ui/native-mobile-select';

interface TaskCategorySelectProps {
  value: TaskCategory;
  onChange: (category: TaskCategory) => void;
}

export const TaskCategorySelect: React.FC<TaskCategorySelectProps> = ({ value, onChange }) => {
  // Convertir TASK_CATEGORIES a array para facilitar el mapeo
  const categories = Object.values(TASK_CATEGORIES);

  const options = categories.map((category) => ({
    value: category,
    label: CATEGORY_LABELS[category],
  }));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Categoría
      </label>
      <NativeMobileSelect
        value={value}
        onChange={(newValue) => onChange(newValue as TaskCategory)}
        options={options}
        placeholder="Selecciona una categoría"
        label="Categoría"
        description="Clasifica tu tarea según su tipo"
      />
    </div>
  );
};