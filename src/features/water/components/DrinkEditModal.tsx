import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drink, DRINKS } from '../types';
import * as Icons from 'lucide-react';

interface DrinkEditModalProps {
  drink: Drink | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDrink: Drink) => void;
}

export const DrinkEditModal: React.FC<DrinkEditModalProps> = ({
  drink,
  isOpen,
  onClose,
  onSave
}) => {
  const [amount, setAmount] = useState('');
  const [time, setTime] = useState('');

  // Actualizar los valores cuando cambia el drink seleccionado
  useEffect(() => {
    if (drink) {
      setAmount(drink.amount.toString());
      setTime(drink.time);
    }
  }, [drink]);

  if (!drink) return null;

  const drinkInfo = DRINKS[drink.type];
  const Icon = Icons[drinkInfo.icon as keyof typeof Icons] as React.ElementType;

  const handleSave = () => {
    const updatedDrink: Drink = {
      ...drink,
      amount: parseInt(amount),
      time,
      hydration: parseInt(amount) * drinkInfo.hydrationFactor
    };
    onSave(updatedDrink);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${drinkInfo.color}`} />
            Editar {drinkInfo.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Cantidad (ml)
            </label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="time" className="text-sm font-medium">
              Hora
            </label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!amount || !time}
          >
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};