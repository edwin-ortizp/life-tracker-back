import React, { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { AlignLeft } from 'lucide-react';
import { useTextAreaKeyboardShortcuts } from '../hooks/useTextAreaKeyboardShortcuts';

interface TaskDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TaskDescriptionInput: React.FC<TaskDescriptionInputProps> = ({ value, onChange }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { handleKeyDown } = useTextAreaKeyboardShortcuts({
    textAreaRef,
    value,
    onChange
  });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <AlignLeft className="w-4 h-4" />
        Descripción de la tarea
        <span className="text-xs text-gray-500 ml-2">
          (Alt+↑↓ mover líneas, Ctrl+L toggle checkbox)
        </span>
      </label>
      <Textarea
        ref={textAreaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Agrega más detalles sobre la tarea..."
        className="min-h-[250px] resize-y"
      />
    </div>
  );
};