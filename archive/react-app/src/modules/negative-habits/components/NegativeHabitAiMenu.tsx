import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { Bot } from 'lucide-react';
import NegativeHabitAiSuggestion from './NegativeHabitAiSuggestion';
import type { NegativeHabitLog } from '../models';

interface NegativeHabitAiMenuProps {
  habits: { [key: string]: NegativeHabitLog };
}

export const NegativeHabitAiMenu: React.FC<NegativeHabitAiMenuProps> = ({ habits }) => {
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
            Analizar hábitos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NegativeHabitAiSuggestion habits={habits} open={openSuggest} onOpenChange={setOpenSuggest} />
    </>
  );
};

export default NegativeHabitAiMenu;
