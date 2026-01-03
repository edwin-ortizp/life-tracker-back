import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import JournalAiRewrite from './JournalAiRewrite';

interface JournalAiMenuProps {
  entry: string;
  selectedDate: Date;
  onInsert?: (text: string) => void;
  onReplace?: (text: string) => void;
}

export const JournalAiMenu: React.FC<JournalAiMenuProps> = ({ entry, selectedDate: _selectedDate, onInsert, onReplace }) => {
  const [openRewrite, setOpenRewrite] = useState(false);

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
          <DropdownMenuItem onSelect={() => setOpenRewrite(true)}>
            Reescribir entrada
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <JournalAiRewrite entry={entry} open={openRewrite} onOpenChange={setOpenRewrite} onInsert={onInsert} onReplace={onReplace} />
    </>
  );
};

export default JournalAiMenu;
