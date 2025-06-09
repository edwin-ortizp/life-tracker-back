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

    const statusMap: Record<string, string> = {
      'in-stock': 'en_stock',
      'low-stock': 'stock_bajo',
      'to-buy': 'pendiente_compra'
    };

    const grouped = filtered.reduce<Record<string, { name: string; quantity: number }[]>>((acc, item) => {
      const key = statusMap[item.status] || item.status;
      if (!acc[key]) acc[key] = [];
      acc[key].push({ name: item.name, quantity: item.quantity });
      return acc;
    }, {});

    const jsonString = JSON.stringify(grouped, null, 2);
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
