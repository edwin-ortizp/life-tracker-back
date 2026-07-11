import React from 'react';
import { Filter, ShoppingCart } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { formatCategory } from '@/modules/shopping-list/utils/categories';
import type { ItemStatus } from '../models';

interface ShoppingFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  sort: 'az' | 'za' | 'category';
  onSortChange: (s: 'az' | 'za' | 'category') => void;
  placeFilter: string;
  onPlaceFilterChange: (v: string) => void;
  statusFilter: ItemStatus | '';
  onStatusFilterChange: (v: ItemStatus | '') => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  onlyToBuy: boolean;
  onOnlyToBuyChange: (v: boolean) => void;
  nextOnly: boolean;
  onNextOnlyChange: (v: boolean) => void;
  expireSoonOnly: boolean;
  onExpireSoonOnlyChange: (v: boolean) => void;
  noPriceOnly?: boolean;
  onNoPriceOnlyChange?: (v: boolean) => void;
  places: string[];
  categories: string[];
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  isMobile: boolean;
}

export const ShoppingFilters: React.FC<ShoppingFiltersProps> = ({
  query,
  onQueryChange,
  sort,
  onSortChange,
  placeFilter,
  onPlaceFilterChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onlyToBuy,
  onOnlyToBuyChange,
  nextOnly,
  onNextOnlyChange,
  expireSoonOnly,
  onExpireSoonOnlyChange,
  noPriceOnly = false,
  onNoPriceOnlyChange,
  places,
  categories,
  filtersOpen,
  setFiltersOpen,
  isMobile
}) => {
  return (
    <Collapsible open={!isMobile || filtersOpen} onOpenChange={setFiltersOpen}>
      <div className="flex gap-2 items-start">
        <Input
          placeholder="Buscar por nombre o código de barras"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className="flex-1 sm:w-60"
        />
        {isMobile && (
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </CollapsibleTrigger>
        )}
      </div>
      <CollapsibleContent className="mt-2">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={sort} onValueChange={v => onSortChange(v as 'az' | 'za' | 'category')}>
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
            onValueChange={v => onPlaceFilterChange(v === 'all' ? '' : v)}
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
            onValueChange={v => onStatusFilterChange(v === 'all' ? '' : (v as ItemStatus))}
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
            onValueChange={v => onCategoryFilterChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {onNoPriceOnlyChange && <SelectItem value="__empty">Sin categoría</SelectItem>}
              {categories.map(c => (
                <SelectItem key={c} value={c}>
                  {formatCategory(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {onNoPriceOnlyChange && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={noPriceOnly} onCheckedChange={v => onNoPriceOnlyChange(Boolean(v))} />
              Sin precio
            </label>
          )}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={onlyToBuy} onCheckedChange={v => onOnlyToBuyChange(Boolean(v))} />
            <ShoppingCart className="w-4 h-4" />
            Lista activa
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={nextOnly} onCheckedChange={v => onNextOnlyChange(Boolean(v))} />
            Próxima compra
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={expireSoonOnly} onCheckedChange={v => onExpireSoonOnlyChange(Boolean(v))} />
            Próximos a vencer
          </label>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ShoppingFilters;
