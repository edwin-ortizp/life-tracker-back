import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import type { PreparedMeal } from '../models';

interface AddPreparedMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: Omit<PreparedMeal, 'id'>, id?: string) => void;
  meal?: PreparedMeal;
}

export const AddPreparedMealModal: React.FC<AddPreparedMealModalProps> = ({ open, onOpenChange, onSave, meal }) => {
  const [name, setName] = useState('');
  const [portions, setPortions] = useState('');

  useEffect(() => {
    if (meal) {
      setName(meal.name);
      setPortions(meal.portions !== undefined ? String(meal.portions) : '');
    } else {
      setName('');
      setPortions('');
    }
  }, [meal, open]);

  const handleSave = () => {
    const data: Omit<PreparedMeal, 'id'> = { name };
    if (portions) data.portions = Number(portions);
    onSave(data, meal?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{meal ? 'Editar' : 'Agregar'} Comida Preparada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="pm-name">Nombre</Label>
            <Input id="pm-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pm-portions">Cantidad/Porciones (opcional)</Label>
            <Input id="pm-portions" type="number" value={portions} onChange={e => setPortions(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPreparedMealModal;
