import React from 'react';
import { ShoppingItem, ItemStatus } from '../types';
import { Button } from '@/components/ui/button';

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

export const KanbanView: React.FC<KanbanViewProps> = ({ items, onMove, onEdit, onDelete }) => {
  return (
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
                {columns.filter(c => c.key !== col.key).map(c => (
                  <Button key={c.key} variant="ghost" size="icon" onClick={() => onMove(item.id, c.key)}>
                    {c.title[0]}
                  </Button>
                ))}
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                  E
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                  X
                </Button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default KanbanView;
