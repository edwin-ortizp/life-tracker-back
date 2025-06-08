import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ShoppingItem, ItemStatus } from '../types';

// Predefined options
const PLACES = [
  'Éxito',
  'D1',
  'Ara',
  'Dollarcity',
  'Olimpica (SAO)',
  'Jumbo',
  'Plaza de mercado',
  'Panadería',
  'Droguería',
  'Otro'
];

const CATEGORIES = [
  'Aseo y Limpieza',
  'Bebidas',
  'Carnes y Pescados',
  'Cereales y Granos',
  'Condimentos y Especias',
  'Congelados',
  'Cuidado Personal',
  'Enlatados y Conservas',
  'Frutas y Verduras',
  'Lácteos y Huevos',
  'Panadería',
  'Snacks y Dulces',
  'Mascotas',
  'Otro'
];

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<ShoppingItem, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
  item?: ShoppingItem;
}

export const ItemModal: React.FC<ItemModalProps> = ({ open, onOpenChange, onSave, onDelete, item }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [place, setPlace] = useState('');
  const [status, setStatus] = useState<ItemStatus>('to-buy');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity);
      setPrice(item.price ? String(item.price) : '');
      setCategory(item.category || '');
      setPlace(item.place || '');
      setStatus(item.status);
    } else {
      setName('');
      setQuantity(1);
      setPrice('');
      setCategory('');
      setPlace('');
      setStatus('to-buy');
    }
  }, [item, open]);  const handleSave = () => {
    const itemData: any = {
      name,
      quantity: Number(quantity),
      status
    };
    
    // Solo incluir campos opcionales si tienen valor
    if (price && price.trim() !== '') {
      itemData.price = Number(price);
    }
    
    if (category && category.trim() !== '') {
      itemData.category = category;
    }
    
    if (place && place.trim() !== '') {
      itemData.place = place;
    }
    
    onSave(itemData, item?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar' : 'Agregar'} Ítem</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">Precio</Label>
              <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>          <div className="space-y-1">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
        </div>
        <DialogFooter className="flex justify-between">
          {item && onDelete ? (
            <Button variant="destructive" onClick={() => {
              onDelete(item.id);
              onOpenChange(false);
            }}>Eliminar</Button>
          ) : <span />}
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemModal;
