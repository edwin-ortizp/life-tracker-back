// MealModal.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { MEAL_TYPES } from '../../types';
import { MealModalProps } from './types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

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

  // handleDelete is removed, logic moved to AlertDialog

  const dayInfo = weekDays.find(d => d.fullDate === selectedMealInfo.date);
  const isEditing = !!selectedMealInfo.meal;

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Comida' : 'Agregar Comida'}
            </DialogTitle>
            <DialogDescription>
              {dayInfo?.dayName} - {selectedMealInfo.date.split('-').slice(1).join('/')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mealName">Nombre de la Comida *</Label>
              <Input
                id="mealName"
                type="text"
                value={formData.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                placeholder="Ej: Ensalada César"
                required
              />
            </div>


            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mealNotes">Notas Adicionales</Label>
              <Input
                id="mealNotes"
                type="text"
                value={formData.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                placeholder="Ej: Sin crutones"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mealRecipe">Receta</Label>
              <Textarea
                id="mealRecipe"
                value={formData.recipe}
                onChange={(e) => onFormChange('recipe', e.target.value)}
                placeholder="Ingredientes y preparación..."
                className="h-40 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex-grow sm:flex-grow-0">
              {isEditing && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la comida.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end justify-end">
              <div>
                <Label htmlFor="mealType" className="sr-only">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => onFormChange('type', value)}
                  name="mealType"
                  required
                >
                  <SelectTrigger id="mealType" className="sm:w-40 w-full">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEAL_TYPES)
                      .sort(([, a], [, b]) => a.order - b.order)
                      .map(([value, { title }]) => (
                        <SelectItem key={value} value={value}>
                          {title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.name}>
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