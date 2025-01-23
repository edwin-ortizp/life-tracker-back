// MealModal.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { MEAL_TYPES } from '../../types';
import { MealModalProps } from './types';

export const MealModal: React.FC<MealModalProps> = ({
  show,
  onClose,
  selectedMealInfo,
  formData,
  onFormChange,
  onSubmit,
  onDelete,
  weekDays,
}) => {
  if (!selectedMealInfo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta comida?')) {
      await onDelete();
    }
  };

  const dayInfo = weekDays.find(d => d.fullDate === selectedMealInfo.date);
  const isEditing = !!selectedMealInfo.meal;

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Comida' : 'Agregar Comida'}
            </DialogTitle>
            <DialogDescription>
              {dayInfo?.dayName} - {selectedMealInfo.date.split('-').slice(1).join('/')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Comida
              </label>
              <select
                value={formData.type}
                onChange={(e) => onFormChange('type', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
              >
                {Object.entries(MEAL_TYPES)
                  .sort(([,a], [,b]) => a.order - b.order)
                  .map(([value, { title }]) => (
                    <option key={value} value={value}>
                      {title}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Comida *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder="Ej: Ensalada César"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder="Ej: Sin crutones"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receta
              </label>
              <textarea
                value={formData.recipe}
                onChange={(e) => onFormChange('recipe', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 h-24 resize-none"
                placeholder="Ingredientes y preparación..."
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!formData.name}
              >
                {isEditing ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MealModal;