import React from 'react';
import { Button } from '@/components/ui/button';
// lucide-react no longer exports `LayoutKanban`; use `Kanban` instead
import { ListTodo, Kanban } from 'lucide-react';

interface TaskViewToggleProps {
  view: 'list' | 'kanban';
  onViewChange: (view: 'list' | 'kanban') => void;
}

export const TaskViewToggle: React.FC<TaskViewToggleProps> = ({ view, onViewChange }) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={view === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="gap-2"
      >
        <ListTodo className="w-4 h-4" />
        <span className="hidden sm:inline">Lista</span>
      </Button>
      <Button
        variant={view === 'kanban' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('kanban')}
        className="gap-2"
      >
        <Kanban className="w-4 h-4" />
        <span className="hidden sm:inline">Kanban</span>
      </Button>
    </div>
  );
};

export default TaskViewToggle;
