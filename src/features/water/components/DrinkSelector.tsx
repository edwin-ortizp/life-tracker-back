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
const QUICK_ACCESS_DRINKS: Array<keyof typeof DRINKS> = [
  // Agua y variantes (las más comunes)
  'water',
  'sparklingWater',
  'flavoredWater',
  // Bebidas calientes y lácteos
  'coffee',
  'tea',
  'aromatica',
  'milk',
  // Bebidas nutritivas
  'juice',
  'sportsdrink',
  // Otras bebidas comunes
  'soda',
  'energyDrink'
];

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4"> {/* Reduced columns and increased gap */}
        {QUICK_ACCESS_DRINKS.map((key) => {
          const drink = DRINKS[key];
          const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
          return (            <div key={key} className="relative">
              <Button
                variant="outline"
                className="w-full h-18 sm:h-14 flex flex-col items-center justify-center gap-1 p-2 text-center" // Improved layout
                onClick={() => onDrinkSelect(selectedDrink === key ? null : key)}
                disabled={disabled}
              >
                <Icon className={`w-5 h-5 ${drink.color} flex-shrink-0`} />
                <span className="text-xs leading-tight break-words">{drink.name}</span> {/* Better text handling */}
              </Button>
              {selectedDrink === key && (
                <div className="absolute top-full left-0 w-full z-10 bg-card shadow-lg rounded-md mt-1 p-1"> {/* Changed bg-white to bg-card */}
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
        })}        {/* Botón para abrir el modal con todas las bebidas */}
        <Button
          variant="outline"
          className="w-full h-18 sm:h-14 flex flex-col items-center justify-center gap-1 p-2"
          onClick={() => setShowModal(true)}
          disabled={disabled}
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs leading-tight">Más bebidas</span>
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