import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { formatDateForInput } from '@/utils/dates';
import { useExportMarkdownRange } from '../hooks/useExportMarkdownRange';

export const ExportRangeButton: React.FC = () => {
  const { exportRange } = useExportMarkdownRange();
  const [open, setOpen] = useState(false);
  const [option, setOption] = useState<'thisWeek' | 'lastWeek' | 'custom'>('thisWeek');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const handleExport = () => {
    const today = new Date();
    let start: Date;
    let end: Date;

    if (option === 'thisWeek') {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
    } else if (option === 'lastWeek') {
      const last = subWeeks(today, 1);
      start = startOfWeek(last, { weekStartsOn: 1 });
      end = endOfWeek(last, { weekStartsOn: 1 });
    } else {
      start = startDate;
      end = endDate;
    }

    exportRange(start, end);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Diario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Diario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={option} onValueChange={val => setOption(val as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">Esta semana</SelectItem>
              <SelectItem value="lastWeek">Semana pasada</SelectItem>
              <SelectItem value="custom">Rango personalizado</SelectItem>
            </SelectContent>
          </Select>
          {option === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                className="border rounded-md px-2 py-1 flex-1"
                value={formatDateForInput(startDate)}
                onChange={e => setStartDate(new Date(e.target.value))}
              />
              <input
                type="date"
                className="border rounded-md px-2 py-1 flex-1"
                value={formatDateForInput(endDate)}
                onChange={e => setEndDate(new Date(e.target.value))}
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport}>Exportar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportRangeButton;
