import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Drink, DRINKS } from '../types';
import { DrinkEditModal } from './DrinkEditModal';

interface DrinkHistoryProps {
  drinks: Drink[];
  showHistory: boolean;
  onToggleHistory: () => void;
  onDeleteDrink: (index: number) => void;
  onEditDrink: (index: number, updatedDrink: Drink) => void;
  isCurrentDate: boolean;
}

export const DrinkHistory: React.FC<DrinkHistoryProps> = ({
  drinks,
  showHistory,
  onToggleHistory,
  onDeleteDrink,
  onEditDrink,
  isCurrentDate
}) => {
  const [editingDrink, setEditingDrink] = useState<{ index: number, drink: Drink } | null>(null);

  const handleEdit = (index: number, drink: Drink) => {
    setEditingDrink({ index, drink });
  };

  const handleSave = (updatedDrink: Drink) => {
    if (editingDrink) {
      onEditDrink(editingDrink.index, updatedDrink);
      setEditingDrink(null);
    }
  };

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
                className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-accent group" // Changed styles
              >
                <Icon className={`w-4 h-4 ${drinkInfo.color}`} />
                <span className="font-medium truncate flex-shrink min-w-0">{drinkInfo.name}</span> {/* Added truncate classes */}
                <span className="text-muted-foreground">{drink.amount}ml</span> {/* Changed text-gray-500 */}
                <span className="text-xs text-muted-foreground ml-auto">{drink.time}</span> {/* Changed text-gray-400 */}
                {isCurrentDate && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEdit(index, drink)}
                    >
                      <Edit2 className="h-4 w-4" /> {/* Changed size */}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onDeleteDrink(index)}
                    >
                      <Trash2 className="h-4 w-4" /> {/* Changed size */}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showHistory && drinks.length === 0 && (
        <div className="mt-4 text-center text-muted-foreground text-sm py-4"> {/* Changed text-gray-500 */}
          No hay registros para este día
        </div>
      )}

      <DrinkEditModal
        drink={editingDrink?.drink || null}
        isOpen={!!editingDrink}
        onClose={() => setEditingDrink(null)}
        onSave={handleSave}
      />
    </div>
  );
};