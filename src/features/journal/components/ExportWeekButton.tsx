import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useExportWeekMarkdown } from '../hooks/useExportWeekMarkdown';

interface ExportWeekButtonProps {
  weekDate?: Date;
}

export const ExportWeekButton: React.FC<ExportWeekButtonProps> = ({ weekDate = new Date() }) => {
  const { exportWeek } = useExportWeekMarkdown();

  return (
    <Button onClick={() => exportWeek(weekDate)} className="flex items-center gap-2" variant="outline">
      <Download className="w-4 h-4" />
      Exportar Semana
    </Button>
  );
};

export default ExportWeekButton;
