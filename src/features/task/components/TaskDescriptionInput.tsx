import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { AlignLeft } from 'lucide-react';

interface TaskDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TaskDescriptionInput: React.FC<TaskDescriptionInputProps> = ({ value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium flex items-center gap-2">
      <AlignLeft className="w-4 h-4" />
      Descripción de la tarea
    </label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Agrega más detalles sobre la tarea..."
      className="min-h-[250px] resize-y"
    />
  </div>
);