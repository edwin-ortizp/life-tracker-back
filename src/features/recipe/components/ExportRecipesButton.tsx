import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Recipe } from '../types';
import { RecipeExportWizard } from './RecipeExportWizard';

interface ExportRecipesButtonProps {
  recipes: Recipe[];
}

export const ExportRecipesButton: React.FC<ExportRecipesButtonProps> = ({ recipes: _recipes }) => {
  const [showExportWizard, setShowExportWizard] = useState(false);

  const handleExport = () => {
    setShowExportWizard(true);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
        <Download className="w-4 h-4" />
        Exportar
      </Button>
      
      <RecipeExportWizard
        open={showExportWizard}
        onOpenChange={setShowExportWizard}
      />
    </>
  );
};

export default ExportRecipesButton;
