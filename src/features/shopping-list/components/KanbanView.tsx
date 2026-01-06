import React, { useMemo, useState } from 'react';
import { addDays, isBefore } from 'date-fns';
import { ShoppingItem, ItemStatus, ItemUnit } from '../types';
import { Button } from '@/components/ui/button';
import { formatCategory } from '../utils/categories';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Eye,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ShoppingFilters from './ShoppingFilters';
import { useResponsive } from '@/hooks/useResponsive';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KanbanViewProps {
  items: ShoppingItem[];
  onMove: (id: string, status: ItemStatus) => void;
  onView: (item: ShoppingItem) => void;
  onToggleNext: (item: ShoppingItem) => void;
  onUpdate: (id: string, data: Partial<ShoppingItem>) => void;
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

const unitOptions: { value: ItemUnit; label: string }[] = [
  { value: 'units', label: 'u' },
  { value: 'grams', label: 'g' },
  { value: 'milliliters', label: 'ml' }
];

const unitLabels: Record<ItemUnit, string> = {
  units: 'u',
  grams: 'g',
  milliliters: 'ml'
};

const parseNumberInput = (value: string, fallback: number) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, parsed);
};

export const KanbanView: React.FC<KanbanViewProps> = ({
  items,
  onMove,
  onView,
  onToggleNext,
  onUpdate
}) => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'az' | 'za' | 'category'>('az');
  const [placeFilter, setPlaceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [onlyToBuy, setOnlyToBuy] = useState(false);
  const [expireSoonOnly, setExpireSoonOnly] = useState(false);
  const [nextOnly, setNextOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const { isMobile } = useResponsive();

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

    if (nextOnly) {
      list = list.filter(i => i.nextPurchase);
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
  }, [items, query, placeFilter, statusFilter, categoryFilter, onlyToBuy, nextOnly, expireSoonOnly, sort]);

  const columnTotals = useMemo(() => {
    const totals: Record<ItemStatus, number> = {
      'to-buy': 0,
      'low-stock': 0,
      'in-stock': 0
    };
    filtered.forEach(item => {
      if (item.price != null) {
        totals[item.status] += item.price * item.toBuy;
      }
    });
    return totals;
  }, [filtered]);

  const formatter = useMemo(() => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }), []);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <ShoppingFilters
            query={query}
            onQueryChange={setQuery}
            sort={sort}
            onSortChange={setSort}
            placeFilter={placeFilter}
            onPlaceFilterChange={setPlaceFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            onlyToBuy={onlyToBuy}
            onOnlyToBuyChange={setOnlyToBuy}
            nextOnly={nextOnly}
            onNextOnlyChange={setNextOnly}
            expireSoonOnly={expireSoonOnly}
            onExpireSoonOnlyChange={setExpireSoonOnly}
            places={places}
            categories={categories}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            isMobile={isMobile}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {columns.map(col => (
            <div key={col.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                  {React.createElement(statusIcons[col.key], { className: 'w-4 h-4' })}
                  {col.title}
                </h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {filtered.filter(it => it.status === col.key).length}
                </span>
              </div>
              <div className="text-xs text-gray-600 font-medium">
                {formatter.format(columnTotals[col.key])}
              </div>
              <div className="space-y-1 h-full max-h-[calc(100vh-260px)] overflow-y-auto">
                {filtered.filter(it => it.status === col.key).map(item => {
                  const limit = addDays(new Date(), 3);
                  const consumeDate = item.consumeBy ? new Date(item.consumeBy) : null;
                  const isExpired = consumeDate ? isBefore(consumeDate, new Date()) : false;
                  const isSoon = consumeDate ? isBefore(consumeDate, limit) : false;
                  const unitValue = (item.unit || 'units') as ItemUnit;

                  return (
                    <Card
                      key={item.id}
                      className={`transition-all duration-200 border-l-4 ${
                        col.key === 'in-stock'
                          ? 'border-l-green-500'
                          : col.key === 'low-stock'
                          ? 'border-l-yellow-500'
                          : 'border-l-blue-500'
                      } ${isSoon || isExpired ? 'border-red-500 bg-red-50/30' : ''} ${isExpired ? 'bg-red-50/50' : ''}`}
                    >
                      <CardContent className="p-1.5 space-y-2">
                        <div
                          className="flex items-start justify-between gap-2 cursor-pointer"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm leading-tight truncate">{item.name}</span>
                              {item.category && (
                                <span className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-[10px] whitespace-nowrap">
                                  {formatCategory(item.category)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span className="uppercase">{col.title}</span>
                              <span className="text-gray-400">|</span>
                              <span>
                                Stock {item.stock} {unitLabels[unitValue]}
                              </span>
                              <span className="text-gray-400">|</span>
                              <span>Comprar {item.toBuy}</span>
                              {(isExpired || isSoon) && (
                                <>
                                  <span className="text-gray-400">|</span>
                                  <span className={isExpired ? 'text-red-600 font-medium' : 'text-orange-600'}>
                                    {isExpired ? 'Vencido' : 'Por vencer'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 ${
                                item.nextPurchase
                                  ? 'text-yellow-600 hover:bg-yellow-50'
                                  : 'text-gray-500 hover:bg-gray-50'
                              }`}
                              onClick={e => {
                                e.stopPropagation();
                                onToggleNext(item);
                              }}
                            >
                              <Star
                                className="w-4 h-4"
                                {...(item.nextPurchase && { fill: 'currentColor' })}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-50"
                              onClick={e => {
                                e.stopPropagation();
                                toggleExpanded(item.id);
                              }}
                            >
                              {expandedItems[item.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {expandedItems[item.id] && (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <label className="flex items-center gap-1">
                                <span className="text-gray-500">Stock</span>
                                <Input
                                  key={`stock-${item.id}-${item.stock}`}
                                  type="number"
                                  defaultValue={item.stock}
                                  className="h-7 px-2 text-xs"
                                  onClick={e => e.stopPropagation()}
                                  onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                                  onBlur={e =>
                                    onUpdate(item.id, {
                                      stock: parseNumberInput(e.target.value, item.stock)
                                    })
                                  }
                                />
                              </label>
                              <label className="flex items-center gap-1">
                                <span className="text-gray-500">Comprar</span>
                                <Input
                                  key={`toBuy-${item.id}-${item.toBuy}`}
                                  type="number"
                                  defaultValue={item.toBuy}
                                  className="h-7 px-2 text-xs"
                                  onClick={e => e.stopPropagation()}
                                  onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                                  onBlur={e =>
                                    onUpdate(item.id, {
                                      toBuy: parseNumberInput(e.target.value, item.toBuy)
                                    })
                                  }
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <label className="flex items-center gap-1">
                                <span className="text-gray-500">Unidad</span>
                                <Select
                                  value={unitValue}
                                  onValueChange={v => onUpdate(item.id, { unit: v as ItemUnit })}
                                >
                                  <SelectTrigger className="h-7 text-xs px-2" onClick={e => e.stopPropagation()}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unitOptions.map(unitOption => (
                                      <SelectItem key={unitOption.value} value={unitOption.value}>
                                        {unitOption.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </label>
                              <label className="flex items-center gap-1">
                                <span className="text-gray-500">Precio</span>
                                <Input
                                  key={`price-${item.id}-${item.price ?? 'none'}`}
                                  type="number"
                                  defaultValue={item.price ?? ''}
                                  className="h-7 px-2 text-xs"
                                  onClick={e => e.stopPropagation()}
                                  onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                                  onBlur={e =>
                                    onUpdate(item.id, {
                                      price: e.target.value === '' ? null : Number(e.target.value)
                                    })
                                  }
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <label className="flex items-center gap-1">
                                <span className="text-gray-500">Tienda</span>
                                <Input
                                  key={`place-${item.id}-${item.place ?? 'none'}`}
                                  type="text"
                                  defaultValue={item.place ?? ''}
                                  placeholder="Tienda"
                                  className="h-7 px-2 text-xs"
                                  onClick={e => e.stopPropagation()}
                                  onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                                  onBlur={e => onUpdate(item.id, { place: e.target.value })}
                                />
                              </label>
                              <label className="flex items-center gap-1">
                                <span className={`text-gray-500 ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                                  Vence
                                </span>
                                <Input
                                  key={`consume-${item.id}-${item.consumeBy ?? 'none'}`}
                                  type="date"
                                  defaultValue={item.consumeBy ?? ''}
                                  className={`h-7 px-2 text-xs ${
                                    isExpired ? 'border-red-400 bg-red-50' : isSoon ? 'border-orange-300 bg-orange-50/50' : ''
                                  }`}
                                  onClick={e => e.stopPropagation()}
                                  onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                                  onBlur={e => onUpdate(item.id, { consumeBy: e.target.value })}
                                />
                              </label>
                            </div>

                            {item.consumeBy && (isExpired || isSoon) && (
                              <div className={`text-[11px] ${isExpired ? 'text-red-600 font-medium' : 'text-orange-600'}`}>
                                {isExpired ? 'Vencido' : 'Por vencer'}
                              </div>
                            )}

                            <div className="flex justify-between gap-1 pt-1">
                              <div className="flex gap-1">
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
                                          className={`h-7 w-7 p-0 ${color}`}
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
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-600 hover:bg-gray-50"
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
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {filtered.filter(it => it.status === col.key).length === 0 && (
                  <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    <div className="text-xs">Sin elementos</div>
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
