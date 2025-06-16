import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  BatteryWarning,
  BatteryLow,
  BatteryMedium,
  Battery,
  BatteryFull
} from 'lucide-react';

interface EnergySelectorProps {
  onSelect: (level: number, comment?: string) => void;
  disabled?: boolean;
}

const LEVEL_COLORS = [
  'bg-red-500 text-white',
  'bg-orange-500 text-white',
  'bg-yellow-400 text-black',
  'bg-lime-500 text-black',
  'bg-green-600 text-white'
];

const LEVEL_ICONS = [
  BatteryWarning,
  BatteryLow,
  BatteryMedium,
  Battery,
  BatteryFull
];

export const EnergySelector: React.FC<EnergySelectorProps> = ({ onSelect, disabled }) => {
  const [comment, setComment] = useState('');

  const handleSelect = (level: number) => {
    onSelect(level, comment || undefined);
    setComment('');
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Comentario opcional"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border rounded p-2 text-sm"
      />
      <div className="grid grid-cols-5 gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((level) => {
          const Icon = LEVEL_ICONS[level - 1];
          return (
            <Button
              key={level}
              variant="default"
              className={`h-12 w-full ${LEVEL_COLORS[level - 1]} flex items-center justify-center`}
              onClick={() => handleSelect(level)}
              disabled={disabled}
            >
              <Icon className="h-5 w-5" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default EnergySelector;
