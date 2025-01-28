// src/features/water/components/DrinkSelector.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { DRINKS } from '../types';
import { DrinkSelectorModal } from './DrinkSelectorModal';
import { Plus } from 'lucide-react';

interface DrinkSelectorProps {
  selectedDrink: string | null;
  onDrinkSelect: (drink: string | null) => void;
  onAmountSelect: (type: keyof typeof DRINKS, amount: number) => void;
  disabled?: boolean;
}

// Lista de bebidas que se mostrarán en el selector rápido
const QUICK_ACCESS_DRINKS: Array<keyof typeof DRINKS> = ['water', 'coffee', 'juice','soup', 'soda','sportsdrink','sparklingWater','flavoredWater','milk','yogurt'];

export const DrinkSelector: React.FC<DrinkSelectorProps> = ({
  selectedDrink,
  onDrinkSelect,
  onAmountSelect,
  disabled
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleModalSelect = (type: keyof typeof DRINKS, amount: number) => {
    onAmountSelect(type, amount);
    setShowModal(false);
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {QUICK_ACCESS_DRINKS.map((key) => {
          const drink = DRINKS[key];
          const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
          return (
            <div key={key} className="relative">
              <Button
                variant="outline"
                className="w-full h-12 flex items-center justify-center gap-2"
                onClick={() => onDrinkSelect(selectedDrink === key ? null : key)}
                disabled={disabled}
              >
                <Icon className={`w-4 h-4 ${drink.color}`} />
                <span className="text-sm">{drink.name}</span>
              </Button>
              {selectedDrink === key && (
                <div className="absolute top-full left-0 w-full z-10 bg-white shadow-lg rounded-md mt-1 p-1">
                  {drink.amounts.map(amount => (
                    <Button
                      key={amount}
                      variant="ghost"
                      className="w-full text-sm justify-between"
                      onClick={() => onAmountSelect(key as keyof typeof DRINKS, amount)}
                    >
                      {amount}ml
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Botón para abrir el modal con todas las bebidas */}
        <Button
          variant="outline"
          className="w-full h-12 flex items-center justify-center gap-2"
          onClick={() => setShowModal(true)}
          disabled={disabled}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Más</span>
        </Button>
      </div>

      <DrinkSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleModalSelect}
      />
    </>
  );
};