import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { LastUpdatedInfo } from './LastUpdatedInfo';

interface JournalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  status: string;
  lastUpdated?: string;
}

export const JournalInput: React.FC<JournalInputProps> = ({
  value,
  onChange,
  onSave,
  status,
  lastUpdated
}) => {
  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="¿Cómo ha sido tu día?"
        className="w-full h-64 p-4 border rounded resize-none focus:ring-2 focus:ring-blue-500"
      />
      
      <div className="flex items-center justify-between">
        <LastUpdatedInfo lastUpdated={lastUpdated} />
        
        <Button 
          onClick={onSave} 
          className={`${lastUpdated ? 'w-auto' : 'w-full'}`}
          disabled={status === 'saving'}
        >
          {status === 'saving' ? (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4 animate-spin" />
              Guardando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar entrada
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};