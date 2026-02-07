import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import type { ShoppingItem } from '@/modules/shopping-list/models';

interface IngredientInput {
  shoppingItemId: string;
  shoppingItemName: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

interface IngredientsSelectorProps {
  ingredients: IngredientInput[];
  onChange: (ingredients: IngredientInput[]) => void;
  availableItems: ShoppingItem[];
}

export const IngredientsSelector: React.FC<IngredientsSelectorProps> = ({
  ingredients,
  onChange,
  availableItems
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');

  const filteredItems = availableItems.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ingredients.some(ing => ing.shoppingItemId === item.id)
  );

  const handleAddIngredient = () => {
    if (!selectedItemId || !quantity || Number(quantity) <= 0) return;

    const selectedItem = availableItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    const newIngredient: IngredientInput = {
      shoppingItemId: selectedItemId,
      shoppingItemName: selectedItem.name,
      quantity: Number(quantity),
      unit: unit.trim() || undefined,
      notes: notes.trim() || undefined
    };

    onChange([...ingredients, newIngredient]);

    // Reset form
    setSelectedItemId('');
    setQuantity('1');
    setUnit('');
    setNotes('');
    setSearchQuery('');
  };

  const handleRemoveIngredient = (itemId: string) => {
    onChange(ingredients.filter(ing => ing.shoppingItemId !== itemId));
  };

  const handleUpdateIngredient = (itemId: string, field: keyof IngredientInput, value: any) => {
    onChange(
      ingredients.map(ing =>
        ing.shoppingItemId === itemId ? { ...ing, [field]: value } : ing
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
        <Label className="text-base font-medium">Agregar Ingrediente</Label>
        <div className="grid gap-3">
          <div className="relative">
            <Input
              placeholder="Buscar producto en tu lista de compras..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-base h-11"
            />
            {searchQuery && filteredItems.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {filteredItems.slice(0, 15).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b last:border-b-0"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setSearchQuery(item.name);
                    }}
                  >
                    <div className="font-medium text-base">{item.name}</div>
                    {item.category && (
                      <div className="text-sm text-gray-500 mt-0.5">{item.category}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Cantidad</Label>
              <Input
                type="number"
                placeholder="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="0"
                step="0.1"
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Unidad</Label>
              <Input
                placeholder="tazas, gramos..."
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Notas</Label>
              <Input
                placeholder="picado, rallado..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddIngredient}
            disabled={!selectedItemId || !quantity || Number(quantity) <= 0}
            className="w-full h-10 text-base"
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Ingrediente
          </Button>
        </div>
      </div>

      {ingredients.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Ingredientes Seleccionados ({ingredients.length})
          </Label>
          <div className="border rounded-lg divide-y max-h-96 overflow-y-auto bg-white">
            {ingredients.map(ing => (
              <div key={ing.shoppingItemId} className="p-4 hover:bg-gray-50 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-base">{ing.shoppingItemName}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {ing.quantity} {ing.unit || 'unidades'}
                      {ing.notes && <span className="text-gray-500"> • {ing.notes}</span>}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveIngredient(ing.shoppingItemId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Cantidad</Label>
                    <Input
                      type="number"
                      value={ing.quantity}
                      onChange={e =>
                        handleUpdateIngredient(ing.shoppingItemId, 'quantity', Number(e.target.value))
                      }
                      min="0"
                      step="0.1"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Unidad</Label>
                    <Input
                      value={ing.unit || ''}
                      onChange={e => handleUpdateIngredient(ing.shoppingItemId, 'unit', e.target.value)}
                      placeholder="tazas, gramos..."
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Notas</Label>
                    <Input
                      value={ing.notes || ''}
                      onChange={e => handleUpdateIngredient(ing.shoppingItemId, 'notes', e.target.value)}
                      placeholder="opcional"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientsSelector;
