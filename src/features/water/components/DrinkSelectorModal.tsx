import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as Icons from 'lucide-react';
import { DRINKS, DRINK_CATEGORIES } from '../types';
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar bebida</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-h-[300px] p-1">
              {drinksByCategory[selectedCategory]?.map(drink => {
                const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
                return (
                  <div key={drink.key} className="relative">
                    <Button
                      variant={selectedDrink === drink.key ? "default" : "outline"}
                      className="w-full h-16 sm:h-12 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-1 sm:p-2"
                      onClick={() => handleDrinkSelect(drink.key)}
                    >
                      <Icon className={`w-4 h-4 ${drink.color}`} />
                      <span className="text-xs sm:text-sm text-center">{drink.name}</span>
                    </Button>
                    {selectedDrink === drink.key && (
                      <div className="absolute top-full left-0 w-full z-10 bg-card shadow-lg rounded-md mt-1 p-1"> {/* Changed bg-white to bg-card */}
                        {drink.amounts.map(amount => (
                          <Button
                            key={amount}
                            variant="ghost"
                            className="w-full text-sm justify-between"
                            onClick={() => handleAmountSelect(amount)}
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
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};