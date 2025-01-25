import React from 'react';
import { Input } from '@/components/ui/input';
import { Type } from 'lucide-react';

interface TaskTitleInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TaskTitleInput: React.FC<TaskTitleInputProps> = ({ value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium flex items-center gap-2">
      <Type className="w-4 h-4" />
      Título
    </label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Título de la tarea..."
    />
  </div>
);