import React, { useMemo, useState } from 'react';
import { ShoppingItem, ItemStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCategory } from '../utils/categories';
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
  Eye
} from 'lucide-react';

interface KanbanViewProps {
  items: ShoppingItem[];
  onMove: (id: string, status: ItemStatus) => void;
  onView: (item: ShoppingItem) => void;
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

export const KanbanView: React.FC<KanbanViewProps> = ({ items, onMove, onView }) => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'az' | 'za' | 'category'>('az');
  const [placeFilter, setPlaceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [onlyToBuy, setOnlyToBuy] = useState(false);

  const places = useMemo(() => {
    return Array.from(new Set(items.map(i => i.place).filter(Boolean))) as string[];
  }, [items]);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];
  }, [items]);

  const filtered = useMemo(() => {
    let list = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

    if (placeFilter) {
      list = list.filter(i => i.place === placeFilter);
    }

    if (statusFilter) {
      list = list.filter(i => i.status === statusFilter);
    }

    if (categoryFilter) {
      list = list.filter(i => i.category === categoryFilter);
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
  }, [items, query, placeFilter, statusFilter, categoryFilter, onlyToBuy, sort]);
  return (
    <TooltipProvider>
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
              onValueChange={v => setStatusFilter(v === 'all' ? '' : (v as ItemStatus))}
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

            <Select
              value={categoryFilter || 'all'}
              onValueChange={v => setCategoryFilter(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>
                    {formatCategory(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={onlyToBuy} onCheckedChange={v => setOnlyToBuy(Boolean(v))} />
              <ShoppingCart className="w-4 h-4" />
              Lista activa
            </label>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.key} className="w-64 flex-shrink-0 space-y-3">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">
              {col.title}
            </h3>
            {filtered.filter(it => it.status === col.key).map(item => (
              <div
                key={item.id}
                className="bg-white shadow-sm border rounded-lg p-2 space-y-1 cursor-pointer"
                onClick={() => onView(item)}
              >
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">
                  {item.quantity} - {item.category && formatCategory(item.category)}
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  {columns.filter(c => c.key !== col.key).map(c => {
                    const Icon = statusIcons[c.key];
                    return (
                      <Tooltip key={c.key}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => {
                              e.stopPropagation();
                              onMove(item.id, c.key);
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mover a {c.title}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation();
                          onView(item);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver detalles</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default KanbanView;
