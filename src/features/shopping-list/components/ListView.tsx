import React, { useState } from 'react';
import { ShoppingItem } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

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
          <div key={item.id} className="bg-white shadow-sm border rounded-lg p-3 flex justify-between items-center">
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">
                Cantidad: {item.quantity}
                {item.category && ` • ${item.category}`}
                {item.place && ` • ${item.place}`}
              </div>
              <div className="text-sm">
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  item.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                  item.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {item.status === 'in-stock' ? 'En Stock' :
                   item.status === 'low-stock' ? 'Poco Stock' :
                   'Por Comprar'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListView;
