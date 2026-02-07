import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Type } from 'lucide-react';

interface TaskTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

export const TaskTitleInput: React.FC<TaskTitleInputProps> = ({ value, onChange, multiline }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium flex items-center gap-2">
      <Type className="w-4 h-4" />
      Título
    </label>
    {multiline ? (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Una tarea por línea"
        className="min-h-[120px]"
      />
    ) : (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Título de la tarea..."
      />
    )}
  </div>
);