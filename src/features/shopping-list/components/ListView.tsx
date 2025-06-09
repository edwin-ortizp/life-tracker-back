import React, { useState, useMemo } from 'react';
import { ShoppingItem, ItemStatus } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ShoppingCart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ListViewProps {
  items: ShoppingItem[];
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({ items, onEdit, onDelete }) => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'az' | 'za' | 'category'>('az');
  const [placeFilter, setPlaceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  const [onlyToBuy, setOnlyToBuy] = useState(false);

  const places = useMemo(() => {
    return Array.from(new Set(items.map(i => i.place).filter(Boolean))) as string[];
  }, [items]);

  const filtered = useMemo(() => {
    let list = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

    if (placeFilter) {
      list = list.filter(i => i.place === placeFilter);
    }

    if (statusFilter) {
      list = list.filter(i => i.status === statusFilter);
    }

    if (onlyToBuy) {
      list = list.filter(i => i.status === 'to-buy');
    }

    let sorted = [...list];
    switch (sort) {
      case 'az':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'category':
        sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
    }

    return sorted;
  }, [items, query, placeFilter, statusFilter, onlyToBuy, sort]);

  const totalPending = useMemo(() => {
    return filtered.reduce((sum, item) => {
      if (item.status === 'to-buy' && item.price !== undefined) {
        return sum + item.price * item.quantity;
      }
      return sum;
    }, 0);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <Input
          placeholder="Buscar"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="sm:w-60"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={sort} onValueChange={v => setSort(v as 'az' | 'za' | 'category')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="az">Nombre A-Z</SelectItem>
              <SelectItem value="za">Nombre Z-A</SelectItem>
              <SelectItem value="category">Categoría</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={placeFilter || 'all'}
            onValueChange={v => setPlaceFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Lugar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los lugares</SelectItem>
              {places.map(p => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter || 'all'}
            onValueChange={v =>
              setStatusFilter(v === 'all' ? '' : (v as ItemStatus))
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="to-buy">Por Comprar</SelectItem>
              <SelectItem value="in-stock">En Stock</SelectItem>
              <SelectItem value="low-stock">Poco Stock</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={onlyToBuy} onCheckedChange={v => setOnlyToBuy(Boolean(v))} />
            <ShoppingCart className="w-4 h-4" />
            Lista activa
          </label>
        </div>
      </div>

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
      <div className="pt-2 border-t text-right font-medium">
        Total pendiente: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalPending)}
      </div>
    </div>
  );
};

export default ListView;
