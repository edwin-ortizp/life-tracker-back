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
            return (              <div 
                key={drink.timestamp}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <Icon className={`w-5 h-5 ${drinkInfo.color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{drinkInfo.name}</span>
                    <span className="text-muted-foreground text-sm font-medium">{drink.amount}ml</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{drink.time}</span>
                </div>
                {isCurrentDate && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-accent-foreground/10 touch-manipulation"
                      onClick={() => handleEdit(index, drink)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 touch-manipulation"
                      onClick={() => onDeleteDrink(index)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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