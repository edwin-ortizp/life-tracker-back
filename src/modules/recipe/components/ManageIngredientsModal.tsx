import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Trash2, Plus, Save } from 'lucide-react';
import type { ShoppingItem } from '@/modules/shopping-list/models';
import type { RecipeIngredientWithItem } from '../models';

interface IngredientInput {
  shoppingItemId: string;
  shoppingItemName: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

interface ManageIngredientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: RecipeIngredientWithItem[];
  availableItems: ShoppingItem[];
  onSave: (ingredients: IngredientInput[]) => Promise<void>;
}

export const ManageIngredientsModal: React.FC<ManageIngredientsModalProps> = ({
  open,
  onOpenChange,
  ingredients,
  availableItems,
  onSave
}) => {
  const [editingIngredients, setEditingIngredients] = useState<IngredientInput[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEditingIngredients(
        ingredients.map(ing => ({
          shoppingItemId: ing.shoppingItemId,
          shoppingItemName: ing.shoppingItem.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes
        }))
      );
      setSearchQuery('');
      setSelectedItem(null);
      setIsSuggestionsOpen(false);
    }
  }, [open, ingredients]);

  const filteredItems = availableItems.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !editingIngredients.some(ing => ing.shoppingItemId === item.id)
  );

  const handleAddIngredient = () => {
    if (!selectedItem || !quantity || Number(quantity) <= 0) return;

    const selectedItemData = availableItems.find(item => item.id === selectedItem.id);
    if (!selectedItemData) return;

    const newIngredient: IngredientInput = {
      shoppingItemId: selectedItem.id,
      shoppingItemName: selectedItemData.name,
      quantity: Number(quantity),
      unit: unit.trim() || undefined,
      notes: notes.trim() || undefined
    };

    setEditingIngredients([...editingIngredients, newIngredient]);

    // Reset form
    setSelectedItem(null);
    setQuantity('1');
    setUnit('');
    setNotes('');
    setSearchQuery('');
    setIsSuggestionsOpen(false);
  };

  const handleRemoveIngredient = (itemId: string) => {
    setEditingIngredients(editingIngredients.filter(ing => ing.shoppingItemId !== itemId));
  };

  const handleUpdateIngredient = (itemId: string, field: keyof IngredientInput, value: any) => {
    setEditingIngredients(
      editingIngredients.map(ing =>
        ing.shoppingItemId === itemId ? { ...ing, [field]: value } : ing
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editingIngredients);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving ingredients:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Ingredientes</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Agregar nuevo ingrediente */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="text-base font-medium text-blue-900">Agregar Ingrediente</Label>
            <div className="grid gap-3">
              <div className="relative">
                <Input
                  placeholder="Buscar producto en tu lista de compras..."
                  value={searchQuery}
                  onChange={e => {
                    const nextValue = e.target.value;
                    setSearchQuery(nextValue);
                    setIsSuggestionsOpen(nextValue.length > 0);
                    if (!selectedItem || selectedItem.name !== nextValue) {
                      setSelectedItem(null);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.length > 0) {
                      setIsSuggestionsOpen(true);
                    }
                  }}
                  className="text-base h-11 bg-white"
                />
                {isSuggestionsOpen && searchQuery && filteredItems.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {filteredItems.slice(0, 15).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-b-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedItem({ id: item.id, name: item.name });
                          setSearchQuery(item.name);
                          setIsSuggestionsOpen(false);
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
              {selectedItem && (
                <p className="text-xs text-blue-700">Seleccionado: {selectedItem.name}</p>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">Cantidad *</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    min="0"
                    step="0.1"
                    className="h-10 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">Unidad</Label>
                  <Input
                    placeholder="tazas, gramos..."
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="h-10 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-700">Notas</Label>
                  <Input
                    placeholder="picado, rallado..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="h-10 bg-white"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddIngredient}
                disabled={!selectedItem || !quantity || Number(quantity) <= 0}
                className="w-full h-10 text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Ingrediente
              </Button>
            </div>
          </div>

          {/* Lista de ingredientes */}
          {editingIngredients.length > 0 ? (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Ingredientes de la Receta ({editingIngredients.length})
              </Label>
              <div className="border rounded-lg divide-y bg-white">
                {editingIngredients.map(ing => (
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
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium mb-2">No hay ingredientes</p>
              <p className="text-sm">Agrega ingredientes usando el buscador de arriba</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageIngredientsModal;
