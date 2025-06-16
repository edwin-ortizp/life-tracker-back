import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  BatteryLow,
  BatteryMedium,
  Battery,
  BatteryFull,
  BatteryCharging
} from 'lucide-react';

interface EnergySelectorProps {
  onSelect: (level: number, comment?: string) => void;
  disabled?: boolean;
}

const ICONS = [BatteryLow, BatteryMedium, Battery, BatteryFull, BatteryCharging];

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
      <div className="grid grid-cols-5 gap-2">
        {ICONS.map((Icon, idx) => (
          <Button
            key={idx}
            variant="outline"
            className="h-12 w-full"
            onClick={() => handleSelect(idx + 1)}
            disabled={disabled}
          >
            <Icon className="w-5 h-5" />
            <span className="sr-only">{idx + 1}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default EnergySelector;
