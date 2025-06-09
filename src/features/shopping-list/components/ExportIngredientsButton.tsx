import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { ShoppingItem } from '../types';
import { toast } from 'sonner';

interface ExportIngredientsButtonProps {
  items: ShoppingItem[];
}

const EXCLUDED_WORDS = ['aseo', 'otro'];

export const ExportIngredientsButton: React.FC<ExportIngredientsButtonProps> = ({ items }) => {
  const handleExport = () => {
    const filtered = items.filter(item => {
      if (!item.category) return true;
      const category = item.category.toLowerCase();
      return !EXCLUDED_WORDS.some(word => category.includes(word));
    });

    const exportData = filtered.map(item => ({
      name: item.name,
      status: item.status,
      quantity: item.quantity
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast.success('Ingredientes copiados al portapapeles');
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
      <Download className="w-4 h-4" />
      Exportar ingredientes disponibles
    </Button>
  );
};

export default ExportIngredientsButton;
