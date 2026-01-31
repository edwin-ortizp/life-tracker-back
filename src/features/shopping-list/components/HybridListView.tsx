import React, { useState, useMemo } from 'react';
import { addDays, isBefore } from 'date-fns';
import { ShoppingItem, ItemStatus, ItemUnit } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, MapPin, Calendar, Package } from 'lucide-react';
import { formatCategory } from '../utils/categories';
import { PLACES } from '../utils/places';
import ShoppingFilters from './ShoppingFilters';
import { useResponsive } from '@/hooks/useResponsive';

interface HybridListViewProps {
  items: ShoppingItem[];
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<ShoppingItem>) => void;
}

const unitOptions: { value: ItemUnit; label: string }[] = [
  { value: 'units', label: 'u' },
  { value: 'grams', label: 'g' },
  { value: 'milliliters', label: 'ml' }
];

const parseNumberInput = (value: string, fallback: number) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, parsed);
};

export const HybridListView: React.FC<HybridListViewProps> = ({ items, onEdit, onDelete, onUpdate }) => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'az' | 'za' | 'category'>('az');
  const [placeFilter, setPlaceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [onlyToBuy, setOnlyToBuy] = useState(false);
  const [nextOnly, setNextOnly] = useState(false);
  const [noPriceOnly, setNoPriceOnly] = useState(false);
  const [expireSoonOnly, setExpireSoonOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { isMobile } = useResponsive();

  const places = useMemo(() => {
    return Array.from(new Set(items.map(i => i.place).filter(Boolean))) as string[];
  }, [items]);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];
  }, [items]);

  const filtered = useMemo(() => {
    let list = items.filter(i =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      (i.barcode && i.barcode.toLowerCase().includes(query.toLowerCase()))
    );

    if (placeFilter) {
      list = list.filter(i => i.place === placeFilter);
    }

    if (statusFilter) {
      list = list.filter(i => i.status === statusFilter);
    }

    if (categoryFilter) {
      if (categoryFilter === '__empty') {
        list = list.filter(i => !i.category);
      } else {
        list = list.filter(i => i.category === categoryFilter);
      }
    }

    if (noPriceOnly) {
      list = list.filter(i => i.price == null);
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
  }, [items, query, placeFilter, statusFilter, categoryFilter, noPriceOnly, onlyToBuy, nextOnly, expireSoonOnly, sort]);

  const totalPending = useMemo(() => {
    return filtered.reduce((sum, item) => {
      if (item.status === 'to-buy' && item.price != null) {
        return sum + item.price * item.toBuy;
      }
      return sum;
    }, 0);
  }, [filtered]);

  const getStatusVariant = (status: ItemStatus) => {
    switch (status) {
      case 'in-stock':
        return 'default';
      case 'low-stock':
        return 'secondary';
      case 'to-buy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: ItemStatus) => {
    switch (status) {
      case 'in-stock':
        return 'En Stock';
      case 'low-stock':
        return 'Poco Stock';
      case 'to-buy':
        return 'Por Comprar';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
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
        noPriceOnly={noPriceOnly}
        onNoPriceOnlyChange={setNoPriceOnly}
        places={places}
        categories={categories}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        isMobile={isMobile}
      />

      <div className="text-right font-medium">
        Total pendiente: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalPending)}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Package className="h-12 w-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-600">No hay productos</h3>
              <p className="text-sm text-gray-500 mt-1">
                No se encontraron productos con los filtros aplicados
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-12 gap-3 p-3 bg-gray-50 border-b text-xs font-medium text-gray-700">
              <div className="col-span-3">Producto</div>
              <div className="col-span-1 text-center">Estado</div>
              <div className="col-span-2 text-center">Stock</div>
              <div className="col-span-1 text-center">Comprar</div>
              <div className="col-span-1 text-center">Precio</div>
              <div className="col-span-1 text-center">Tienda</div>
              <div className="col-span-1 text-center">Vence</div>
              <div className="col-span-1 text-center">Prox</div>
              <div className="col-span-1 text-center">Acc</div>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map((item, index) => {
                const limit = addDays(new Date(), 3);
                const consumeDate = item.consumeBy ? new Date(item.consumeBy) : null;
                const isExpired = consumeDate ? isBefore(consumeDate, new Date()) : false;
                const isSoon = consumeDate ? isBefore(consumeDate, limit) : false;
                const unitValue = item.unit || 'units';

                return (
                  <div
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <div className="md:hidden p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getStatusVariant(item.status)} className="text-xs">
                              {getStatusText(item.status)}
                            </Badge>
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {formatCategory(item.category)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.price != null && (
                            <span className="text-green-600">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-1">
                          <span className="text-gray-500">Stock</span>
                          <Input
                            key={`m-stock-${item.id}-${item.stock}`}
                            type="number"
                            defaultValue={item.stock}
                            className="h-7 px-2 text-xs"
                            onBlur={e => onUpdate(item.id, { stock: parseNumberInput(e.target.value, item.stock) })}
                          />
                        </label>
                        <label className="flex items-center gap-1">
                          <span className="text-gray-500">Comprar</span>
                          <Input
                            key={`m-toBuy-${item.id}-${item.toBuy}`}
                            type="number"
                            defaultValue={item.toBuy}
                            className="h-7 px-2 text-xs"
                            onBlur={e => onUpdate(item.id, { toBuy: parseNumberInput(e.target.value, item.toBuy) })}
                          />
                        </label>
                        <label className="flex items-center gap-1">
                          <span className="text-gray-500">Unidad</span>
                          <Select value={unitValue} onValueChange={v => onUpdate(item.id, { unit: v as ItemUnit })}>
                            <SelectTrigger className="h-7 text-xs px-2">
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
                            key={`m-price-${item.id}-${item.price ?? 'none'}`}
                            type="number"
                            defaultValue={item.price ?? ''}
                            className="h-7 px-2 text-xs"
                            onBlur={e => onUpdate(item.id, { price: e.target.value === '' ? null : Number(e.target.value) })}
                          />
                        </label>
                        <label className="flex items-center gap-1">
                          <span className="text-gray-500">Tienda</span>
                          <Select
                            value={item.place || '__none'}
                            onValueChange={v => onUpdate(item.id, { place: v === '__none' ? '' : v })}
                          >
                            <SelectTrigger className="h-7 text-xs px-2">
                              <SelectValue placeholder="Sin tienda" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">Sin tienda</SelectItem>
                              {PLACES.map(place => (
                                <SelectItem key={place} value={place}>
                                  {place}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                        <label className="flex items-center gap-1">
                          <span className={`text-gray-500 ${isExpired ? 'text-red-600 font-medium' : ''}`}>Vence</span>
                          <Input
                            key={`m-consume-${item.id}-${item.consumeBy ?? 'none'}`}
                            type="date"
                            defaultValue={item.consumeBy ?? ''}
                            className={`h-7 px-2 text-xs ${isExpired ? 'border-red-400 bg-red-50' : isSoon ? 'border-orange-300 bg-orange-50/50' : ''}`}
                            onBlur={e => onUpdate(item.id, { consumeBy: e.target.value })}
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={Boolean(item.nextPurchase)}
                            onCheckedChange={v => onUpdate(item.id, { nextPurchase: Boolean(v) })}
                          />
                          Proxima compra
                        </label>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="h-7 w-7 p-0 text-blue-600"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item.id)}
                            className="h-7 w-7 p-0 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:grid grid-cols-12 gap-3 p-3 text-xs items-center">
                      <div className="col-span-3">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {item.place && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.place}
                              </span>
                            )}
                            {item.consumeBy && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {item.consumeBy}
                              </span>
                            )}
                          </div>
                          {item.category && (
                            <Badge variant="outline" className="text-[10px]">
                              {formatCategory(item.category)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Select value={item.status} onValueChange={v => onUpdate(item.id, { status: v as ItemStatus })}>
                          <SelectTrigger className="h-7 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in-stock">En Stock</SelectItem>
                            <SelectItem value="to-buy">Por Comprar</SelectItem>
                            <SelectItem value="low-stock">Poco Stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center gap-2">
                          <Input
                            key={`d-stock-${item.id}-${item.stock}`}
                            type="number"
                            defaultValue={item.stock}
                            className="h-7 w-16 px-2 text-xs text-center"
                            onBlur={e => onUpdate(item.id, { stock: parseNumberInput(e.target.value, item.stock) })}
                          />
                          <Select value={unitValue} onValueChange={v => onUpdate(item.id, { unit: v as ItemUnit })}>
                            <SelectTrigger className="h-7 w-16 text-xs px-2">
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
                        </div>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Input
                          key={`d-toBuy-${item.id}-${item.toBuy}`}
                          type="number"
                          defaultValue={item.toBuy}
                          className="h-7 w-16 px-2 text-xs text-center"
                          onBlur={e => onUpdate(item.id, { toBuy: parseNumberInput(e.target.value, item.toBuy) })}
                        />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Input
                          key={`d-price-${item.id}-${item.price ?? 'none'}`}
                          type="number"
                          defaultValue={item.price ?? ''}
                          className="h-7 w-20 px-2 text-xs text-center"
                          onBlur={e => onUpdate(item.id, { price: e.target.value === '' ? null : Number(e.target.value) })}
                        />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Select
                          value={item.place || '__none'}
                          onValueChange={v => onUpdate(item.id, { place: v === '__none' ? '' : v })}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs px-2">
                            <SelectValue placeholder="Sin tienda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">Sin tienda</SelectItem>
                            {PLACES.map(place => (
                              <SelectItem key={place} value={place}>
                                {place}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Input
                          key={`d-consume-${item.id}-${item.consumeBy ?? 'none'}`}
                          type="date"
                          defaultValue={item.consumeBy ?? ''}
                          className={`h-7 w-28 px-2 text-xs ${isExpired ? 'border-red-400 bg-red-50' : isSoon ? 'border-orange-300 bg-orange-50/50' : ''}`}
                          onBlur={e => onUpdate(item.id, { consumeBy: e.target.value })}
                        />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Checkbox
                          checked={Boolean(item.nextPurchase)}
                          onCheckedChange={v => onUpdate(item.id, { nextPurchase: Boolean(v) })}
                        />
                      </div>

                      <div className="col-span-1 flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Editar producto"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HybridListView;
