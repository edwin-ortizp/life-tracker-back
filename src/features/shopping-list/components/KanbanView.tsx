import React from 'react';
import { ShoppingItem, ItemStatus } from '../types';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  ShoppingCart,
  AlertTriangle,
  Check,
  Pencil,
  Trash2
} from 'lucide-react';

interface KanbanViewProps {
  items: ShoppingItem[];
  onMove: (id: string, status: ItemStatus) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

const columns: { key: ItemStatus; title: string }[] = [
  { key: 'to-buy', title: 'Por Comprar' },
  { key: 'low-stock', title: 'Poco Stock' },
  { key: 'in-stock', title: 'En Stock' }
];

const statusIcons: Record<ItemStatus, React.ElementType> = {
  'to-buy': ShoppingCart,
  'low-stock': AlertTriangle,
  'in-stock': Check
};

export const KanbanView: React.FC<KanbanViewProps> = ({ items, onMove, onEdit, onDelete }) => {
  return (
    <TooltipProvider>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.key} className="w-64 flex-shrink-0 space-y-3">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">
              {col.title}
            </h3>
            {items.filter(it => it.status === col.key).map(item => (
              <div key={item.id} className="bg-white shadow-sm border rounded-lg p-2 space-y-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">{item.quantity} - {item.category}</div>
                <div className="flex justify-end gap-2 text-xs">
                  {columns.filter(c => c.key !== col.key).map(c => {
                    const Icon = statusIcons[c.key];
                    return (
                      <Tooltip key={c.key}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onMove(item.id, c.key)}>
                            <Icon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mover a {c.title}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default KanbanView;
