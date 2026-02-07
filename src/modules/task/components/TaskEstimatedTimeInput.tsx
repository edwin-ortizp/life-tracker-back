import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { Clock } from 'lucide-react';

interface TaskEstimatedTimeInputProps {
  value?: number;
  onChange: (value?: number) => void;
}

export const TaskEstimatedTimeInput: React.FC<TaskEstimatedTimeInputProps> = ({ value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium flex items-center gap-2">
      <Clock className="w-4 h-4" />
      Tiempo estimado (min)
    </label>
    <Input
      type="number"
      min="0"
      placeholder="Ej. 30"
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === '' ? undefined : Number(val));
      }}
    />
  </div>
);

export default TaskEstimatedTimeInput;
