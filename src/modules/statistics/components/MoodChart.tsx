import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { cn } from '@/lib/utils';

interface MoodPoint {
  label: string;
  value: number | null;
}

interface Props {
  data: MoodPoint[];
  className?: string;
}

export const MoodChart: React.FC<Props> = ({ data, className }) => {
  return (
    <div className={cn('h-24', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -20, right: 10 }}>
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#f59e0b" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
