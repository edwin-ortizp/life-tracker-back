// src/features/diary/components/DiaryInput.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface DiaryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  status: string;
}

export const DiaryInput: React.FC<DiaryInputProps> = ({
  value,
  onChange,
  onSave,
  status
}) => {
  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="¿Cómo ha sido tu día?"
        className="w-full h-64 p-4 border rounded resize-none focus:ring-2 focus:ring-blue-500"
      />
      <Button 
        onClick={onSave} 
        className="w-full"
        disabled={status === 'saving'}
      >
        {status === 'saving' ? (
          <span className="flex items-center gap-2">
            <Save className="w-4 h-4 animate-spin" />
            Guardando...
          </span>
        ) : (
          'Guardar entrada'
        )}
      </Button>
    </div>
  );
};