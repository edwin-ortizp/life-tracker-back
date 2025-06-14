import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  progress?: number; // 0-100
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, progress }) => (
  <Card className="flex items-center">
    <CardContent className="flex items-center gap-4 p-4 w-full">
      {icon && <div className="text-primary">{icon}</div>}
      <div className="flex-1 space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-lg font-bold">{value}</p>
        {typeof progress === 'number' && (
          <Progress value={progress} className="h-2" />
        )}
      </div>
    </CardContent>
  </Card>
);

export default StatCard;
