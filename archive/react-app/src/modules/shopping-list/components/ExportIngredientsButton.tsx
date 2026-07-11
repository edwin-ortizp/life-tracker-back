import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Download } from 'lucide-react';
import type { ShoppingItem } from '../models';
import { ShoppingExportWizard } from './ShoppingExportWizard';

interface ExportIngredientsButtonProps {
  items: ShoppingItem[];
}


export const ExportIngredientsButton: React.FC<ExportIngredientsButtonProps> = ({ items: _items }) => {
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
      
      <ShoppingExportWizard
        open={showExportWizard}
        onOpenChange={setShowExportWizard}
      />
    </>
  );
};

export default ExportIngredientsButton;
