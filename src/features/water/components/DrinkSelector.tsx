// src/features/water/components/DrinkSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { DRINKS } from '../types';

interface DrinkSelectorProps {
  selectedDrink: string | null;
  onDrinkSelect: (drink: string | null) => void;
  onAmountSelect: (type: keyof typeof DRINKS, amount: number) => void;
  disabled?: boolean;
}

export const DrinkSelector: React.FC<DrinkSelectorProps> = ({
  selectedDrink,
  onDrinkSelect,
  onAmountSelect,
  disabled
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {Object.entries(DRINKS).map(([key, drink]) => {
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
    </div>
  );
};