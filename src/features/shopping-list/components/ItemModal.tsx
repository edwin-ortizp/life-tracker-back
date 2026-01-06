import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ShoppingItem, ItemStatus, ItemUnit } from '../types';
import { CATEGORIES, formatCategory } from '../utils/categories';
import { PLACES } from '../utils/places';

const UNITS: { value: ItemUnit; label: string }[] = [
  { value: 'units', label: 'Unidades' },
  { value: 'grams', label: 'Gramos' },
  { value: 'milliliters', label: 'Mililitros' }
];

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<ShoppingItem, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
  item?: ShoppingItem;
}

export const ItemModal: React.FC<ItemModalProps> = ({ open, onOpenChange, onSave, onDelete, item }) => {
  const [names, setNames] = useState('');
  const [stock, setStock] = useState(1);
  const [toBuy, setToBuy] = useState(0);
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [place, setPlace] = useState('');
  const [consumeBy, setConsumeBy] = useState('');
  const [status, setStatus] = useState<ItemStatus>('to-buy');
  const [nextPurchase, setNextPurchase] = useState(false);
  const [unit, setUnit] = useState<ItemUnit>('units');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setNames(item.name);
      setStock(item.stock);
      setToBuy(item.toBuy);
      setPrice(item.price ? String(item.price) : '');
      setCategory(item.category || '');
      setPlace(item.place || '');
      setConsumeBy(item.consumeBy || '');
      setStatus(item.status);
      setNextPurchase(Boolean(item.nextPurchase));
      setUnit(item.unit || 'units');
    } else {
      setNames('');
      setStock(1);
      setToBuy(0);
      setPrice('');
      setCategory('');
      setPlace('');
      setConsumeBy('');
      setStatus('to-buy');
      setNextPurchase(false);
      setUnit('units');
    }
    setError(null);
  }, [item, open]);

  const handleSave = () => {
    if (!names.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    if (Number.isNaN(Number(stock)) || Number(stock) < 0) {
      setError('El stock debe ser un numero valido mayor o igual a 0.');
      return;
    }

    if (Number.isNaN(Number(toBuy)) || Number(toBuy) < 0) {
      setError('La cantidad a comprar debe ser un numero valido mayor o igual a 0.');
      return;
    }

    if (price && (Number.isNaN(Number(price)) || Number(price) < 0)) {
      setError('El precio debe ser un numero valido mayor o igual a 0.');
      return;
    }

    const baseData: any = {
      stock: Number(stock),
      toBuy: Number(toBuy),
      status,
      nextPurchase,
      unit
    };

    if (price && price.trim() !== '') {
      baseData.price = Number(price);
    } else if (item) {
      baseData.price = null;
    }

    if (category && category.trim() !== '') {
      baseData.category = category;
    }

    if (place && place.trim() !== '') {
      baseData.place = place;
    }

    if (consumeBy && consumeBy.trim() !== '') {
      baseData.consumeBy = consumeBy;
    } else if (item) {
      baseData.consumeBy = '';
    }

    if (item) {
      onSave({ ...baseData, name: names }, item.id);
    } else {
      const lines = names
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
      lines.forEach(n => onSave({ ...baseData, name: n }));
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar' : 'Agregar'} Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="names">Nombre{item ? '' : 's'}</Label>
                {item ? (
                  <Input id="names" value={names} onChange={e => setNames(e.target.value)} />
                ) : (
                  <Textarea
                    id="names"
                    value={names}
                    onChange={e => setNames(e.target.value)}
                    placeholder="Un producto por linea"
                    className="min-h-[140px]"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seleccionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {formatCategory(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="place">Lugar de compra</Label>
                <Select value={place} onValueChange={setPlace}>
                  <SelectTrigger id="place">
                    <SelectValue placeholder="Seleccionar lugar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACES.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="status">Estado</Label>
                <Select value={status} onValueChange={v => setStatus(v as ItemStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-stock">En Stock</SelectItem>
                    <SelectItem value="to-buy">Por Comprar</SelectItem>
                    <SelectItem value="low-stock">Poco Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="consumeBy">Consumir antes de</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="consumeBy"
                    type="date"
                    value={consumeBy}
                    onChange={e => setConsumeBy(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-2 text-xs"
                    onClick={() => setConsumeBy('')}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={nextPurchase}
                  onCheckedChange={v => setNextPurchase(Boolean(v))}
                />
                Marcar como proxima compra
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" value={stock} onChange={e => setStock(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="toBuy">A Comprar</Label>
              <Input id="toBuy" type="number" value={toBuy} onChange={e => setToBuy(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit">Unidad</Label>
              <Select value={unit} onValueChange={v => setUnit(v as ItemUnit)}>
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(unitOption => (
                    <SelectItem key={unitOption.value} value={unitOption.value}>
                      {unitOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">Precio</Label>
              <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between">
          {item && onDelete ? (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(item.id);
                onOpenChange(false);
              }}
            >
              Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;
