import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Recipe } from '../types';
import { RecipeExportWizard } from './RecipeExportWizard';

interface ExportRecipesButtonProps {
  recipes: Recipe[];
  iconOnly?: boolean;
  className?: string;
}

export const ExportRecipesButton: React.FC<ExportRecipesButtonProps> = ({ 
  recipes: _recipes, 
  iconOnly = false,
  className 
}) => {
  const [showExportWizard, setShowExportWizard] = useState(false);

  const handleExport = () => {
    setShowExportWizard(true);
  };

  return (
    <>
      {iconOnly ? (
        <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${className}`} onClick={handleExport}>
          <Download className="w-4 h-4" />
          <span className="sr-only">Exportar</span>
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={handleExport} className={`flex items-center gap-2 ${className}`}>
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      )}
      
      <RecipeExportWizard
        open={showExportWizard}
        onOpenChange={setShowExportWizard}
      />
    </>
  );
};

export default ExportRecipesButton;
