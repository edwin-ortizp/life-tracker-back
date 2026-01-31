import React, { useState, useMemo } from 'react';
import { addDays, isBefore } from 'date-fns';
import { ShoppingItem, ItemStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ChevronUp, ChevronDown, MapPin, Calendar, Package } from 'lucide-react';
import { formatCategory } from '../utils/categories';
import ShoppingFilters from './ShoppingFilters';
import { useResponsive } from '@/hooks/useResponsive';

interface ListViewProps {
  items: ShoppingItem[];
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<ShoppingItem>) => void;
}

export const ListView: React.FC<ListViewProps> = ({ items, onEdit, onDelete, onUpdate }) => {
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
        return sum + item.price * item.stock;
      }
      return sum;
    }, 0);
  }, [filtered]);

  const handleStockDecrease = (item: ShoppingItem) => {
    const newStock = item.stock - 1;
    if (newStock === 0) {
      // Si el stock llega a 0, cambiar estado a "to-buy" y mantener stock en 1
      onUpdate(item.id, { 
        stock: 1, 
        status: 'to-buy' as ItemStatus 
      });
    } else if (newStock > 0) {
      // Si el stock es mayor a 0, solo actualizar el stock
      onUpdate(item.id, { stock: newStock });
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
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
              <div className="col-span-3">Producto</div>
              <div className="col-span-2 text-center">Categoría</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-2 text-center">Stock</div>
              <div className="col-span-2 text-center">Precio</div>
              <div className="col-span-1 text-center">Acciones</div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-gray-100">
              {filtered.map((item, index) => {
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
                  <div
                    key={item.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.name}
                          </h3>
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
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {item.stock}
                          </span>
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdate(item.id, { stock: item.stock + 1 })}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <span className="text-xs min-w-[1.5rem] text-center">{item.stock}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStockDecrease(item)}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="h-6 w-6 p-0 text-blue-600 ml-1"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item.id)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-4">
                      {/* Producto Column */}
                      <div className="col-span-3">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.name}
                          </h3>
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
                        </div>
                      </div>

                      {/* Categoría Column */}
                      <div className="col-span-2 flex justify-center items-center">
                        {item.category ? (
                          <Badge variant="outline" className="text-xs">
                            {formatCategory(item.category)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Sin categoría</span>
                        )}
                      </div>

                      {/* Estado Column */}
                      <div className="col-span-2 flex justify-center items-center">
                        <Badge variant={getStatusVariant(item.status)} className="text-xs">
                          {getStatusText(item.status)}
                        </Badge>
                      </div>

                      {/* Cantidad Column */}
                      <div className="col-span-2 flex justify-center items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStockDecrease(item)}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">
                            {item.stock}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdate(item.id, { stock: item.stock + 1 })}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Precio Column */}
                      <div className="col-span-2 flex justify-center items-center">
                        {item.price != null ? (
                          <span className="text-sm font-medium text-green-600">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.price)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin precio</span>
                        )}
                      </div>

                      {/* Acciones Column */}
                      <div className="col-span-1 flex justify-center items-center gap-1">
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

export default ListView;
