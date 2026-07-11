import React from 'react';
import { Clock } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/select';
import { TIME_OF_DAY, TIME_OF_DAY_LABELS, TimeOfDay } from '../models';

interface TaskTimeOfDaySelectProps {
  value?: TimeOfDay;
  onChange: (value?: TimeOfDay) => void;
}

const UNASSIGNED_VALUE = 'none';

export const TaskTimeOfDaySelect: React.FC<TaskTimeOfDaySelectProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Momento del día
      </label>
      <Select
        value={value || UNASSIGNED_VALUE}
        onValueChange={(v) => onChange(v === UNASSIGNED_VALUE ? undefined : (v as TimeOfDay))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sin asignar">
            {value ? TIME_OF_DAY_LABELS[value] : 'Sin asignar'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(TIME_OF_DAY).map((t) => (
            <SelectItem key={t} value={t}>
              {TIME_OF_DAY_LABELS[t as TimeOfDay]}
            </SelectItem>
          ))}
          <SelectItem value={UNASSIGNED_VALUE}>Sin asignar</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskTimeOfDaySelect;
