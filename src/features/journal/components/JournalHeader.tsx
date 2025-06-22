import React from 'react';
import { Book, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JournalHeaderProps {
  onLock: () => void;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({ onLock }) => {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2">
        <Book className="w-5 h-5" />
        <span className="font-medium">Mi Diario</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onLock}
          title="Bloquear diario"
        >
          <Lock className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};