import React, { useMemo, useState } from 'react';
import { addDays, isBefore } from 'date-fns';
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
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
  const [expireSoonOnly, setExpireSoonOnly] = useState(false);

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

    if (expireSoonOnly) {
      const limit = addDays(new Date(), 3);
      list = list.filter(i => {
        if (!i.consumeBy) return false;
        const d = new Date(i.consumeBy);
        return isBefore(d, limit);
      });
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
  }, [items, query, placeFilter, statusFilter, categoryFilter, onlyToBuy, expireSoonOnly, sort]);
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Barra de filtros compacta */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder="Buscar productos..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="lg:w-64"
            />
            
            <div className="flex flex-wrap gap-2">
              <Select value={sort} onValueChange={v => setSort(v as 'az' | 'za' | 'category')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="az">A-Z</SelectItem>
                  <SelectItem value="za">Z-A</SelectItem>
                  <SelectItem value="category">Categoría</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={placeFilter || 'all'}
                onValueChange={v => setPlaceFilter(v === 'all' ? '' : v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Lugar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
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
                <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-36">
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
            </div>
            
            <div className="flex flex-wrap gap-3 items-center text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={onlyToBuy} onCheckedChange={v => setOnlyToBuy(Boolean(v))} />
                <ShoppingCart className="w-4 h-4" />
                Lista activa
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={expireSoonOnly} onCheckedChange={v => setExpireSoonOnly(Boolean(v))} />
                <AlertTriangle className="w-4 h-4" />
                Por vencer
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {columns.map(col => (
          <div key={col.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-gray-700 flex items-center gap-2">
                {React.createElement(statusIcons[col.key], { className: "w-4 h-4" })}
                {col.title}
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {filtered.filter(it => it.status === col.key).length}
              </span>
            </div>
            <div className="space-y-2 h-full max-h-[calc(100vh-300px)] overflow-y-auto">
            {filtered.filter(it => it.status === col.key).map(item => {
              const limit = addDays(new Date(), 3);
              const consumeDate = item.consumeBy ? new Date(item.consumeBy) : null;
              const isExpired = consumeDate ? isBefore(consumeDate, new Date()) : false;
              const isSoon = consumeDate ? isBefore(consumeDate, limit) : false;
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
                    col.key === 'in-stock' 
                      ? 'border-l-green-500 hover:border-l-green-600' 
                      : col.key === 'low-stock' 
                      ? 'border-l-yellow-500 hover:border-l-yellow-600' 
                      : 'border-l-blue-500 hover:border-l-blue-600'
                  } ${isSoon || isExpired ? 'border-red-500 bg-red-50/30' : ''} ${isExpired ? 'bg-red-50/50' : ''}`}
                  onClick={() => onView(item)}
                >
                  <CardContent className="p-2 pb-1 md:p-2 md:pb-1">
                    <div className="font-medium text-sm leading-tight mb-1">{item.name}</div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-medium">{item.quantity}</span>
                      {item.category && (
                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                          {formatCategory(item.category)}
                        </span>
                      )}
                    </div>
                    
                    {item.consumeBy && (
                      <div className={`text-xs mt-1 ${isExpired ? 'text-red-600 font-medium' : isSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                        {isExpired ? '⚠️ Vencido' : isSoon ? '⏰ Por vencer' : 'Hasta'} {item.consumeBy}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="bg-gray-50/70 border-t border-gray-100 p-0 md:p-0">
                    <div className="flex justify-center gap-1 w-full px-2 py-2">
                      {columns.filter(c => c.key !== col.key).map(c => {
                        const Icon = statusIcons[c.key];
                        const color =
                          c.key === 'in-stock'
                            ? 'text-green-600 hover:bg-green-50'
                            : c.key === 'low-stock'
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-blue-600 hover:bg-blue-50';
                        return (
                          <Tooltip key={c.key}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${color}`}
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
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-50"
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
                  </CardFooter>
                </Card>
              );
            })}
            {filtered.filter(it => it.status === col.key).length === 0 && (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-sm">Sin elementos</div>
              </div>
            )}
            </div>
          </div>
        ))}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default KanbanView;
