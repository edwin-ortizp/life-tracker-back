import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { BatteryLow, BatteryMedium, Battery, BatteryFull, BatteryCharging } from 'lucide-react';
import { EditEnergyModal } from './EditEnergyModal';
import type { EnergyEntry } from '../types';

interface EnergyHistoryProps {
  entries: EnergyEntry[];
  onUpdate: (originalTimestamp: number, entry: EnergyEntry) => Promise<void>;
  onDelete: (timestamp: number) => Promise<void>;
}

const ICONS = [BatteryLow, BatteryMedium, Battery, BatteryFull, BatteryCharging];

export const EnergyHistory: React.FC<EnergyHistoryProps> = ({ entries, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selected, setSelected] = useState<EnergyEntry | null>(null);

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const display = isExpanded ? sorted : sorted.slice(0, 3);
  const hasMore = entries.length > 3;

  const average = entries.length > 0 ?
    Math.round((entries.reduce((acc, e) => acc + e.level, 0) / entries.length) * 10) / 10
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
      <div className="mt-4 space-y-2">
        {display.map((entry, index) => {
          const Icon = ICONS[entry.level - 1];
          return (
            <div
              key={`${entry.timestamp}_${index}`}
              className="flex items-center gap-2 p-2 bg-muted rounded"
            >
              <Icon className="w-4 h-4" />
              {entry.comment && <span className="text-sm flex-1">{entry.comment}</span>}
              <span className="text-gray-500 ml-auto text-sm">{entry.time}</span>
              <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0" onClick={() => setSelected(entry)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full h-8 text-sm text-gray-500 hover:text-gray-900"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <span className="flex items-center gap-1">
                Ver menos <ChevronUp className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Ver más ({entries.length - 3}) <ChevronDown className="h-4 w-4" />
              </span>
            )}
          </Button>
        )}
        {entries.length === 0 && (
          <div className="text-center text-gray-500 py-4">No hay registros para este día</div>
        )}
        {entries.length > 0 && (
          <div className="text-center text-xs text-muted-foreground">Promedio del día: {average}</div>
        )}
      </div>
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
