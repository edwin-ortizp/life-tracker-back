import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Recipe } from '../types';

interface ExportRecipesButtonProps {
  recipes: Recipe[];
}

export const ExportRecipesButton: React.FC<ExportRecipesButtonProps> = ({ recipes }) => {
  const handleExport = () => {
    const grouped = recipes.reduce<Record<string, Recipe[]>>((acc, recipe) => {
      const key = recipe.mealType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(recipe);
      return acc;
    }, {});

    const json = JSON.stringify(grouped, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
      <Download className="w-4 h-4" />
      Exportar recetas
    </Button>
  );
};

export default ExportRecipesButton;
