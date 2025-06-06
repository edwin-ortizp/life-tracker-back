import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { DRINKS } from '../types';
import { DrinkSelectorModal } from './DrinkSelectorModal';
import { Plus, X } from 'lucide-react';
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
  };  return (
    <div className="space-y-4 mb-6">
      {/* Título de sección */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Agregar bebida</h3>
        <p className="text-sm text-gray-500">Selecciona una bebida para registrar</p>
      </div>      {/* Bebidas rápidas - Grid limpio y funcional */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_ACCESS_DRINKS.map((key) => {
          const drink = DRINKS[key];
          const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
          const isSelected = selectedDrink === key;
          
          return (
            <Button
              key={key}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-16 w-full flex flex-col items-center justify-center gap-1 p-2",
                "transition-all duration-200 hover:scale-105",
                isSelected && "ring-2 ring-blue-500 ring-offset-1"
              )}
              onClick={() => handleDrinkSelect(key)}
              disabled={disabled}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isSelected ? "text-white" : drink.color
              )} />
              <span className="text-xs font-medium leading-tight text-center">
                {drink.name}
              </span>
            </Button>
          );
        })}
        
        {/* Botón para más bebidas */}
        <Button
          variant="outline"
          className="h-16 w-full flex flex-col items-center justify-center gap-1 p-2 border-dashed border-2 hover:border-blue-300 hover:bg-blue-50"
          onClick={() => setShowModal(true)}
          disabled={disabled}
        >
          <Plus className="w-5 h-5 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Más</span>
        </Button>
      </div>

      {/* Panel de cantidades - Diseño simple y limpio */}
      {selectedDrink && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {(() => {
                const drink = DRINKS[selectedDrink as keyof typeof DRINKS];
                const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
                return (
                  <>
                    <Icon className={cn("w-5 h-5", drink.color)} />
                    <span className="font-medium text-gray-900">{drink.name}</span>
                  </>
                );
              })()}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
              onClick={() => onDrinkSelect(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {DRINKS[selectedDrink as keyof typeof DRINKS].amounts.map(amount => (
              <Button
                key={amount}
                variant="outline"
                className="h-10 bg-white hover:bg-blue-50 hover:border-blue-300"
                onClick={() => {
                  onAmountSelect(selectedDrink as keyof typeof DRINKS, amount);
                  onDrinkSelect(null);
                }}
              >
                <span className="font-medium">{amount}ml</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <DrinkSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleModalSelect}
      />
    </div>
  );
};