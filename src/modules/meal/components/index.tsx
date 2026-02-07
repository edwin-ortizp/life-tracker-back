// features/meal/components/MealPlanner.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useAuth } from '@/shared/hooks/useAuth';
import { AlertCircle, MoreVertical, Upload, Download, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/shared/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import WeeklyView from './WeeklyView';
import { ImportMealPlan } from './ImportMealPlan';
import { PasteMealPlan } from './PasteMealPlan';
import { useMealPlan } from '../controllers/useMealPlan.supabase';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import type { MealProps } from '../models';
import { useToast } from '@/shared/components/ui/use-toast';
import { useShoppingList } from '@/modules/shopping-list/controllers/useShoppingList.supabase';
import { useRecipes } from '@/modules/recipe/controllers/useRecipes.supabase';
import { usePreparedMeals } from '@/modules/prepared-meals/controllers/usePreparedMeals.supabase';
import { CompactMealHeader } from '@/shared/components/navigation/CompactMealHeader';
import { Calendar, ChefHat, ShoppingCart, Package } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MealExportWizard } from './MealExportWizard';

export const MealPlanner: React.FC<MealProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportWizard, setShowExportWizard] = useState(false);

  const {
    mealPlan,
    status,
    error,
    addMeal,
    removeMeal,
    importMealPlan,
  } = useMealPlan();
  const { isOnline } = useNetworkStatus();

  const { items: _items } = useShoppingList();
  const { recipes: _recipes } = useRecipes();
  const { meals: _preparedMeals } = usePreparedMeals();

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

  const handleOpenExportWizard = () => {
    setShowExportWizard(true);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header con navegación unificada */}
      <CompactMealHeader
        title="Plan de Comidas"
        views={[{ key: 'weekly', label: 'Semanal' }]}
        activeViewKey="weekly"
        onViewChange={() => navigate('/meal/view/weekly')}
      >
        {/* Desktop: Icon buttons */}
        <TooltipProvider>
          <div className="hidden md:flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Importar Plan</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importar Plan</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleOpenExportWizard}>
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Exportar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/meal/config')}>
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Configuracion</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configuracion</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
        {/* Mobile: Three dots menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 md:hidden">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar Plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenExportWizard}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/meal/config')}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {location.pathname !== '/meal/view/weekly' && (
              <DropdownMenuItem asChild>
                <Link to="/meal/view/weekly" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Plan de Comidas
                </Link>
              </DropdownMenuItem>
            )}
            {!location.pathname.startsWith('/shopping-list') && (
              <DropdownMenuItem asChild>
                <Link to="/shopping-list/view/list" className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Lista de Compras
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== '/recipes/view/list' && (
              <DropdownMenuItem asChild>
                <Link to="/recipes/view/list" className="flex items-center">
                  <ChefHat className="mr-2 h-4 w-4" />
                  Recetas
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== '/prepared-meals/view/list' && (
              <DropdownMenuItem asChild>
                <Link to="/prepared-meals/view/list" className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Comidas Preparadas
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CompactMealHeader>
      
      {/* Content area */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <WeeklyView
          mealPlan={mealPlan}
          onAddMeal={handleAddMeal}
          onRemoveMeal={handleRemoveMeal}
          disabled={status === "saving"}
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
                disabled={status === "saving"}
              />
              <PasteMealPlan 
                onImport={handleImportMealPlan}
                disabled={status === "saving"}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wizard de exportación */}
      <MealExportWizard
        open={showExportWizard}
        onOpenChange={setShowExportWizard}
      />
      
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
      </div>
    </div>
  );
};

export default MealPlanner;
