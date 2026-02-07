import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import * as Icons from 'lucide-react';
import { DRINKS, DRINK_CATEGORIES } from '../models';
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface DrinkSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: keyof typeof DRINKS, amount: number) => void;
}

export const DrinkSelectorModal: React.FC<DrinkSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [selectedDrink, setSelectedDrink] = useState<keyof typeof DRINKS | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('water');

  // Agrupar bebidas por categoría
  const drinksByCategory = Object.entries(DRINKS).reduce((acc, [key, drink]) => {
    const category = drink.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ key: key as keyof typeof DRINKS, ...drink });
    return acc;
  }, {} as Record<string, Array<{ key: keyof typeof DRINKS } & typeof DRINKS[keyof typeof DRINKS]>>);

  const handleDrinkSelect = (drink: keyof typeof DRINKS) => {
    if (selectedDrink === drink) {
      setSelectedDrink(null);
    } else {
      setSelectedDrink(drink);
    }
  };

  const handleAmountSelect = (amount: number) => {
    if (selectedDrink) {
      onSelect(selectedDrink, amount);
      setSelectedDrink(null);
      onClose();
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Seleccionar bebida</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DRINK_CATEGORIES).map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
              {drinksByCategory[selectedCategory]?.map(drink => {
                const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
                const isSelected = selectedDrink === drink.key;
                return (
                  <div key={drink.key} className="relative">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full h-20 flex flex-col items-center justify-center gap-2 p-3 text-center transition-all hover:scale-105 transform"
                      onClick={() => handleDrinkSelect(drink.key)}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : drink.color} flex-shrink-0`} />
                      <span className="text-xs leading-tight break-words font-medium">
                        {drink.name}
                      </span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Panel de cantidades mejorado */}
          {selectedDrink && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 sm:flex-shrink-0">
                  {(() => {
                    const drink = DRINKS[selectedDrink];
                    const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
                    return (
                      <>
                        <Icon className={`w-6 h-6 ${drink.color}`} />
                        <div>
                          <h3 className="font-medium text-gray-900">{drink.name}</h3>
                          <p className="text-sm text-gray-600">Selecciona la cantidad</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {DRINKS[selectedDrink].amounts.map(amount => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700 font-medium transition-all hover:scale-105 transform"
                        onClick={() => handleAmountSelect(amount)}
                      >
                        {amount}ml
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 sm:flex-shrink-0"
                  onClick={() => setSelectedDrink(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};