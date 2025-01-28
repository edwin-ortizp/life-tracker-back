import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { DRINKS, DRINK_CATEGORIES } from '../types';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar bebida</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="water" className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="w-full justify-start">
              {Object.entries(DRINK_CATEGORIES).map(([key, name]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="min-w-fit"
                >
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {Object.entries(drinksByCategory).map(([category, drinks]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                {drinks.map(drink => {
                  const Icon = Icons[drink.icon as keyof typeof Icons] as React.ElementType;
                  return (
                    <div key={drink.key} className="relative">
                      <Button
                        variant={selectedDrink === drink.key ? "default" : "outline"}
                        className="w-full h-12 flex items-center justify-center gap-2"
                        onClick={() => handleDrinkSelect(drink.key)}
                      >
                        <Icon className={`w-4 h-4 ${drink.color}`} />
                        <span className="text-sm">{drink.name}</span>
                      </Button>
                      {selectedDrink === drink.key && (
                        <div className="absolute top-full left-0 w-full z-10 bg-white shadow-lg rounded-md mt-1 p-1">
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
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};