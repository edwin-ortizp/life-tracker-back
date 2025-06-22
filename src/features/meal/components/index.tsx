// features/meal/components/MealPlanner.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, AlertCircle, MoreVertical, Settings, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WeeklyView from './WeeklyView';
import { ImportMealPlan } from './ImportMealPlan';
import { PasteMealPlan } from './PasteMealPlan';
import { useMealPlan } from '../hooks/useMealPlan';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { MealProps } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { useShoppingList } from '@/features/shopping-list/hooks/useShoppingList';
import { useRecipes } from '@/features/recipe/hooks/useRecipes';
import { usePreparedMeals } from '@/features/prepared-meals/hooks/usePreparedMeals';

export const MealPlanner: React.FC<MealProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showImportDialog, setShowImportDialog] = useState(false);

  const {
    mealPlan,
    status,
    error,
    addMeal,
    removeMeal,
    importMealPlan,
    resync
  } = useMealPlan();
  const { isOnline } = useNetworkStatus();

  const { items } = useShoppingList();
  const { recipes } = useRecipes();
  const { meals: preparedMeals } = usePreparedMeals();

  if (!user) {
    return (
      <Card className="w-full h-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para planificar tus comidas</p>
        </CardContent>
      </Card>
    );
  }

  const handleAddMeal = async (...args: Parameters<typeof addMeal>) => {
    try {
      await addMeal(...args);
    } catch (err) {
      console.error('Error adding meal:', err);
      toast({ title: "Error al Agregar", description: "No se pudo agregar la comida.", variant: "destructive" });
    }
  };
  const handleRemoveMeal = async (...args: Parameters<typeof removeMeal>) => {
    try {
      await removeMeal(...args);
    } catch (err) {
      console.error('Error removing meal:', err);
      toast({ title: "Error al Eliminar", description: "No se pudo eliminar la comida.", variant: "destructive" });
    }
  };

  const handleImportMealPlan = async (...args: Parameters<typeof importMealPlan>) => {
    try {
      await importMealPlan(...args);
      toast({ title: "Importación Exitosa", description: "El plan de comidas se ha importado correctamente." });
      setShowImportDialog(false);
    } catch (err) {
      console.error('Error importing meal plan:', err);
      toast({ title: "Error al Importar", description: "No se pudo importar el plan de comidas.", variant: "destructive" });
    }
  };

  const handleExportPlan = () => {
    const jsonString = JSON.stringify(mealPlan, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast({ title: 'Plan de comidas copiado al portapapeles' });
    });
  };

  const handleExportIngredients = () => {
    const grouped = items.reduce(
      (acc, item) => {
        if (item.category === 'Aseo y Limpieza') {
          return acc;
        }
        if (item.status === 'in-stock') {
          acc.inStock.push({ name: item.name, quantity: item.quantity });
        } else if (item.status === 'low-stock') {
          acc.lowStock.push({ name: item.name, quantity: item.quantity });
        }
        return acc;
      },
      {
        inStock: [] as { name: string; quantity: number }[],
        lowStock: [] as { name: string; quantity: number }[]
      }
    );

    const prepared = preparedMeals.map(m => ({ name: m.name, ...(m.portions !== undefined && { portions: m.portions }) }));

    const favRecipes = recipes
      .filter(r => r.favorite === true)
      .map(r => ({
        name: r.name,
        ...(r.description && { description: r.description })
      }));

    const exportData = {
      shoppingList: grouped,
      preparedMeals: prepared,
      recipes: favRecipes
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast({ title: 'Ingredientes y recetas copiados al portapapeles' });
    });
  };

  return (
    <div className="w-full h-full flex flex-col">      {/* Header con menú de opciones */}
      <div className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
      <div className="flex items-center space-x-3">
          <h2 className="text-lg sm:text-xl font-bold">Plan de Comidas</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-500">Semanal</span>
          </div>
          <Link to="/shopping-list" className="text-sm text-blue-600 underline">
            Lista de Compras
          </Link>
          <Link to="/recipes" className="text-sm text-blue-600 underline">
            Recetas
          </Link>
        <Link to="/prepared-meals" className="text-sm text-blue-600 underline">
          Comidas Preparadas
        </Link>
      </div>

        {/* Menú de opciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Importar Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPlan}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportIngredients}>
              <Download className="mr-2 h-4 w-4" />
              Exportar ingredientes y recetas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Content area */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <WeeklyView
          mealPlan={mealPlan}
          onAddMeal={handleAddMeal}
          onRemoveMeal={handleRemoveMeal}
          disabled={status === 'saving' || !isOnline}
          selectedDate={selectedDate}
        />

        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>        )}
      </div>

      {/* Modal de importación */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Plan de Comidas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Puedes importar un plan de comidas desde un archivo JSON o pegando el contenido directamente.
            </div>
            <div className="space-y-2">
              <ImportMealPlan 
                onImport={handleImportMealPlan}
                disabled={status === 'saving' || !isOnline}
              />
              <PasteMealPlan 
                onImport={handleImportMealPlan}
                disabled={status === 'saving' || !isOnline}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex justify-center items-center gap-2 text-xs p-2 border-t bg-white">
        {status === 'saving' && (
          <span className="text-blue-500">Guardando...</span>
        )}
        {status === 'pending' && (
          <span className="text-yellow-600">Pendiente de sincronizar</span>
        )}
        {status === 'saved' && (
          <span className="text-green-600">Sincronizado</span>
        )}
        {status === 'error' && (
          <span className="text-red-600">Error de sincronización</span>
        )}
        {!isOnline && <span className="text-orange-600">Offline</span>}
        <Button onClick={resync} variant="link" className="p-0 h-auto">Reintentar</Button>
      </div>
    </div>
  );
};

export default MealPlanner;