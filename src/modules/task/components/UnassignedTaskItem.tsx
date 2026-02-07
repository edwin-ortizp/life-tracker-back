import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import type { Task, TimeOfDay } from '../models';

interface UnassignedTaskItemProps {
  task: Task;
  onAssign: (id: string, time: TimeOfDay) => void;
  onView?: (task: Task) => void;
}

const EMOJIS: Record<TimeOfDay, string> = {
  morning: '🌅',
  afternoon: '🏙️',
  evening: '🌙'
};

export const UnassignedTaskItem: React.FC<UnassignedTaskItemProps> = ({ task, onAssign, onView }) => {
  const handleClick = (e: React.MouseEvent, time: TimeOfDay) => {
    e.stopPropagation();
    onAssign(task.id, time);
  };

  return (
    <Card
      onClick={() => onView?.(task)}
      className="bg-white hover:shadow p-2 cursor-pointer space-y-2"
    >
      <CardContent className="p-0 space-y-2">
        <span className="text-sm font-medium break-words line-clamp-2 block">
          {task.title}
        </span>
        <div className="flex gap-1">
          {(Object.keys(EMOJIS) as TimeOfDay[]).map((t) => (
            <Button
              key={t}
              size="icon"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-muted"
              title={`Asignar a ${t}`}
              onClick={(e) => handleClick(e, t)}
            >
              {EMOJIS[t]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnassignedTaskItem;
