// src/components/ai/AiMenuButton.tsx
import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export interface AiMenuItem {
  label: string;
  onClick: () => void;
}

interface AiMenuButtonProps {
  items: AiMenuItem[];
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
}

/**
 * Componente reutilizable para menús de IA
 * Muestra un botón con icono de bot y un menú desplegable con opciones
 */
export const AiMenuButton: React.FC<AiMenuButtonProps> = ({
  items,
  label = 'IA',
  size = 'sm',
  variant = 'outline'
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} className="flex items-center gap-2 text-blue-600">
          <Bot className="w-4 h-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => (
          <DropdownMenuItem key={index} onSelect={item.onClick}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AiMenuButton;
