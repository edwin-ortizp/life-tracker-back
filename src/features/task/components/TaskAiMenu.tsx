import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { TaskAiSuggestion } from './TaskAiSuggestion';
import type { Task } from '../types';

interface TaskAiMenuProps {
  tasks: Task[];
}

export const TaskAiMenu: React.FC<TaskAiMenuProps> = ({ tasks }) => {
  const [showSuggest, setShowSuggest] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="flex items-center gap-2 text-blue-600">
            <Bot className="w-4 h-4" />
            IA
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setShowSuggest(true)}>
            Sugerir tareas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TaskAiSuggestion tasks={tasks} open={showSuggest} onOpenChange={setShowSuggest} />
    </>
  );
};

export default TaskAiMenu;
