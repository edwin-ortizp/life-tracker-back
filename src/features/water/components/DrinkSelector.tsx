import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { DRINKS } from '../types';
import { DrinkSelectorModal } from './DrinkSelectorModal';
import { Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleDrinkSelect = (drink: string) => {
    // Si el drink ya está seleccionado, deseleccionarlo
    if (selectedDrink === drink) {
      onDrinkSelect(null);
    } else {
      onDrinkSelect(drink);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        {QUICK_ACCESS_DRINKS.map((key) => {
          const drink = DRINKS[key];
          const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
          const isSelected = selectedDrink === key;
          
          return (
            <div key={key} className="relative">
              <Button
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "w-full h-20 sm:h-16 flex flex-col items-center justify-center gap-2 p-3 text-center transition-all",
                  isSelected && "ring-2 ring-blue-500 ring-offset-2"
                )}
                onClick={() => handleDrinkSelect(key)}
                disabled={disabled}
              >
                <Icon className={cn(
                  "w-6 h-6 flex-shrink-0",
                  isSelected ? "text-white" : drink.color
                )} />
                <span className="text-xs leading-tight break-words font-medium">
                  {drink.name}
                </span>
                {isSelected && (
                  <ChevronDown className="w-3 h-3 text-white" />
                )}
              </Button>
              
              {/* Panel de cantidades siempre visible cuando está seleccionado */}
              {isSelected && (
                <div className="absolute top-full left-0 w-full z-20 bg-white shadow-lg rounded-md mt-2 p-2 border">
                  <div className="text-xs text-gray-600 mb-2 font-medium text-center">
                    Selecciona cantidad
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {drink.amounts.map(amount => (
                      <Button
                        key={amount}
                        variant="ghost"
                        className="w-full text-sm justify-center py-2 hover:bg-blue-50"
                        onClick={() => {
                          onAmountSelect(key as keyof typeof DRINKS, amount);
                          onDrinkSelect(null); // Deseleccionar después de agregar
                        }}
                      >
                        {amount}ml
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Botón para abrir el modal con todas las bebidas */}
        <Button
          variant="outline"
          className="w-full h-20 sm:h-16 flex flex-col items-center justify-center gap-2 p-3 border-dashed"
          onClick={() => setShowModal(true)}
          disabled={disabled}
        >
          <Plus className="w-6 h-6 text-gray-500" />
          <span className="text-xs leading-tight text-gray-500 font-medium">Más bebidas</span>
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