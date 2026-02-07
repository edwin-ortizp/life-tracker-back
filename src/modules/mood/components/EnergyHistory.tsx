import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Edit2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/shared/components/ui/accordion';
import { EditEnergyModal } from './EditEnergyModal';
import type { EnergyEntry } from '../models';

interface EnergyHistoryProps {
  entries: EnergyEntry[];
  onUpdate: (originalTimestamp: number, entry: EnergyEntry) => Promise<void>;
  onDelete: (timestamp: number) => Promise<void>;
}

const DOT_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-400',
  'bg-lime-500',
  'bg-green-600'
];

export const EnergyHistory: React.FC<EnergyHistoryProps> = ({ entries, onUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<EnergyEntry | null>(null);

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  const average = entries.length > 0
    ? Math.round((entries.reduce((acc, e) => acc + e.level, 0) / entries.length) * 10) / 10
    : 0;

  const handleSave = async (updated: EnergyEntry) => {
    if (!selected) return;
    await onUpdate(selected.timestamp, updated);
    setSelected(null);
  };

  const handleDelete = async () => {
    if (!selected) return;
    await onDelete(selected.timestamp);
    setSelected(null);
  };

  return (
    <>
      <Accordion
        type="single"
        collapsible
        value={isOpen ? 'history' : ''}
        onValueChange={(val) => setIsOpen(!!val)}
      >
        <AccordionItem value="history" className="border-none">
          <AccordionTrigger className="w-full h-11 flex items-center justify-between gap-2 border rounded-lg bg-background hover:bg-accent data-[state=open]:rounded-b-none">
            <span className="text-sm font-semibold">Historial de hoy</span>
          </AccordionTrigger>
          <AccordionContent className="mt-2 space-y-2">
            {sorted.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-2">No hay registros para este día</div>
            ) : (
              sorted.map((entry, index) => (
                <div
                  key={`${entry.timestamp}_${index}`}
                  className="flex items-center gap-2 p-2 bg-muted rounded"
                >
                  <span className={`w-3 h-3 rounded-full ${DOT_COLORS[entry.level - 1]}`} />
                  <span className="text-sm">Nivel {entry.level}</span>
                  {entry.comment && <span className="text-sm flex-1">{entry.comment}</span>}
                  <span className="text-gray-500 ml-auto text-sm">{entry.time}</span>
                  <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0" onClick={() => setSelected(entry)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            {sorted.length > 0 && (
              <div className="text-center text-xs text-muted-foreground">Promedio del día: {average}</div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <EditEnergyModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        energyEntry={selected}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
};

export default EnergyHistory;
