import React, { useState } from 'react';
import { ShoppingItem } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ListViewProps {
  items: ShoppingItem[];
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({ items, onEdit, onDelete }) => {
  const [query, setQuery] = useState('');
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <Input placeholder="Buscar" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="bg-white shadow-sm border rounded-lg p-2 flex justify-between">
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{item.quantity} - {item.category}</div>
            </div>
            <div className="flex gap-2 text-xs items-center">
              <span className="text-gray-500">{item.status}</span>
              <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>E</Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>X</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListView;
