import React from 'react';
import { BookOpen, Edit } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDailySummary } from '@/features/statistics/hooks/useDailySummary';

interface QuickAccessJournalProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessJournal: React.FC<QuickAccessJournalProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { summary, loading } = useDailySummary(date);

  const wordCount = summary.journal.words;
  const hasEntry = wordCount > 0;

  const handleOpenJournal = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/journal');
  };

  return (
    <DailyWidget
      title="Diario"
      icon={BookOpen}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/journal')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            {hasEntry ? (
              <>
                <p className="text-lg font-bold text-indigo-600">
                  {wordCount} palabras
                </p>
                <p className="text-xs text-gray-500">
                  Entrada registrada
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Sin entrada
                </p>
                <p className="text-xs text-gray-400">
                  Escribe tus pensamientos
                </p>
              </>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenJournal}
            className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
          >
            <Edit className="w-3 h-3" />
            {variant === 'detailed' && (hasEntry ? 'Editar' : 'Escribir')}
          </Button>
        </div>
        
        {variant === 'detailed' && hasEntry && (
          <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
            <p>📝 Tienes una entrada de {wordCount} palabras para hoy</p>
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessJournal;