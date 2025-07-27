import React from 'react';
import { ModularExportWizard, ModularExportWizardConfig } from '@/components/ui/modular-export-wizard';
import { useShoppingList } from '../hooks/useShoppingList';
import type { ShoppingItem } from '../types';
import { ShoppingCart } from 'lucide-react';

interface ShoppingExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShoppingExportWizard: React.FC<ShoppingExportWizardProps> = ({
  open,
  onOpenChange
}) => {
  const { items } = useShoppingList();

  const config: ModularExportWizardConfig = {
    title: 'Exportar Lista de Compras',
    modules: [
      {
        id: 'shoppingList',
        label: 'Lista de Compras',
        description: 'Elementos de la lista con opciones de formato',
        icon: <ShoppingCart className="w-4 h-4" />,
        fields: [
          {
            id: 'in-stock',
            label: 'En stock',
            description: 'Elementos que ya tienes disponibles'
          },
          {
            id: 'low-stock',
            label: 'Stock bajo',
            description: 'Elementos que necesitas reponer pronto'
          },
          {
            id: 'to-buy',
            label: 'Pendientes de compra',
            description: 'Elementos que planeas comprar'
          },
          {
            id: 'nextPurchase',
            label: 'Solo próximas compras',
            description: 'Filtrar solo elementos marcados para próxima compra'
          },
          {
            id: 'excludeCategories',
            label: 'Excluir no comestibles',
            description: 'Filtrar elementos de aseo y otros no comestibles'
          },
          {
            id: 'withQuantities',
            label: 'Incluir cantidades',
            description: 'Agregar información de cantidades'
          },
          {
            id: 'withPrices',
            label: 'Incluir precios',
            description: 'Agregar información de precios cuando esté disponible'
          },
          {
            id: 'withDates',
            label: 'Incluir fechas de consumo',
            description: 'Agregar fechas de consumo preferente'
          },
          {
            id: 'withPlaces',
            label: 'Incluir lugares de compra',
            description: 'Agregar información de dónde comprar'
          },
          {
            id: 'byStatus',
            label: 'Agrupar por estado',
            description: 'Organizar elementos por estado (en stock, stock bajo, pendiente)'
          },
          {
            id: 'byCategory',
            label: 'Agrupar por categoría',
            description: 'Organizar elementos por categorías'
          }
        ],
        dataGenerator: (selectedFields, _customValues) => {
          let filteredItems = [...items];

          // Filtrar por categorías no alimentarias
          if (selectedFields.includes('excludeCategories')) {
            const EXCLUDED_WORDS = ['aseo', 'otro', 'limpieza'];
            filteredItems = filteredItems.filter(item => {
              if (!item.category) return true;
              const category = item.category.toLowerCase();
              return !EXCLUDED_WORDS.some(word => category.includes(word));
            });
          }

          // Filtrar por próxima compra
          if (selectedFields.includes('nextPurchase')) {
            filteredItems = filteredItems.filter(item => item.nextPurchase === true);
          }

          // Filtrar por estado - solo incluir los estados seleccionados
          const statusFilters: string[] = [];
          if (selectedFields.includes('in-stock')) statusFilters.push('in-stock');
          if (selectedFields.includes('low-stock')) statusFilters.push('low-stock');
          if (selectedFields.includes('to-buy')) statusFilters.push('to-buy');

          // Si se seleccionó al menos un estado, filtrar por esos estados
          if (statusFilters.length > 0) {
            filteredItems = filteredItems.filter(item => statusFilters.includes(item.status));
          }

          // Función para formatear un item
          const formatItem = (item: ShoppingItem) => {
            const result: any = { name: item.name };

            if (selectedFields.includes('withQuantities')) {
              result.quantity = item.stock;
            }
            if (selectedFields.includes('withPrices') && item.price) {
              result.price = item.price;
            }
            if (selectedFields.includes('withDates') && item.consumeBy) {
              result.consumeBy = item.consumeBy;
            }
            if (selectedFields.includes('withPlaces') && item.place) {
              result.place = item.place;
            }

            return result;
          };

          // Determinar estructura de agrupación
          if (selectedFields.includes('byStatus') && selectedFields.includes('byCategory')) {
            // Agrupación doble: por estado y por categoría
            const grouped = filteredItems.reduce<Record<string, Record<string, any[]>>>((acc, item) => {
              const statusMap: Record<string, string> = {
                'in-stock': 'en_stock',
                'low-stock': 'stock_bajo',
                'to-buy': 'pendiente_compra'
              };
              
              const status = statusMap[item.status] || item.status;
              const category = item.category || 'sin_categoria';
              
              if (!acc[status]) acc[status] = {};
              if (!acc[status][category]) acc[status][category] = [];
              
              acc[status][category].push(formatItem(item));
              return acc;
            }, {});

            return { listaCompras: grouped };
          } else if (selectedFields.includes('byStatus')) {
            // Solo por estado
            const statusMap: Record<string, string> = {
              'in-stock': 'en_stock',
              'low-stock': 'stock_bajo',
              'to-buy': 'pendiente_compra'
            };

            const grouped = filteredItems.reduce<Record<string, any[]>>((acc, item) => {
              const key = statusMap[item.status] || item.status;
              if (!acc[key]) acc[key] = [];
              acc[key].push(formatItem(item));
              return acc;
            }, {});

            return { listaCompras: grouped };
          } else if (selectedFields.includes('byCategory')) {
            // Solo por categoría
            const grouped = filteredItems.reduce<Record<string, any[]>>((acc, item) => {
              const key = item.category || 'sin_categoria';
              if (!acc[key]) acc[key] = [];
              acc[key].push(formatItem(item));
              return acc;
            }, {});

            return { listaCompras: grouped };
          } else {
            // Lista simple
            return {
              listaCompras: filteredItems.map(formatItem),
              total: filteredItems.length
            };
          }
        }
      }
    ]
  };

  return (
    <ModularExportWizard
      open={open}
      onOpenChange={onOpenChange}
      config={config}
    />
  );
};