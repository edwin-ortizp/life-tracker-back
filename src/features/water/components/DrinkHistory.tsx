// src/features/water/components/DrinkHistory.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Drink, DRINKS } from '../types';

interface DrinkHistoryProps {
  drinks: Drink[];
  showHistory: boolean;
  onToggleHistory: () => void;
  onDeleteDrink: (index: number) => void;
  isCurrentDate: boolean;
}

export const DrinkHistory: React.FC<DrinkHistoryProps> = ({
  drinks,
  showHistory,
  onToggleHistory,
  onDeleteDrink,
  isCurrentDate
}) => {
  return (
    <div>
      <Button 
        variant="outline" 
        className="w-full"
        onClick={onToggleHistory}
      >
        {showHistory ? (
          <ChevronUp className="w-4 h-4 mr-2" />
        ) : (
          <ChevronDown className="w-4 h-4 mr-2" />
        )}
        Historial de hoy
      </Button>

      {showHistory && drinks.length > 0 && (
        <div className="mt-4 space-y-2">
          {drinks.map((drink, index) => {
            const drinkInfo = DRINKS[drink.type];
            const Icon = Icons[drinkInfo.icon as keyof typeof Icons] as React.ElementType;
            return (
              <div 
                key={drink.timestamp}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 group"
              >
                <Icon className={`w-4 h-4 ${drinkInfo.color}`} />
                <span className="font-medium">{drinkInfo.name}</span>
                <span className="text-gray-500">{drink.amount}ml</span>
                <span className="text-xs text-gray-400 ml-auto">{drink.time}</span>
                {isCurrentDate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteDrink(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showHistory && drinks.length === 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm py-4">
          No hay registros para este día
        </div>
      )}
    </div>
  );
};
