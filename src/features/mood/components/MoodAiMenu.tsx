import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import MoodAiSuggestion from './MoodAiSuggestion';

interface MoodAiMenuProps {
  selectedDate: Date;
}

export const MoodAiMenu: React.FC<MoodAiMenuProps> = ({ selectedDate }) => {
  const [openSuggest, setOpenSuggest] = useState(false);

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
          <DropdownMenuItem onSelect={() => setOpenSuggest(true)}>
            Sugerir moods
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <MoodAiSuggestion selectedDate={selectedDate} open={openSuggest} onOpenChange={setOpenSuggest} />
    </>
  );
};

export default MoodAiMenu;
