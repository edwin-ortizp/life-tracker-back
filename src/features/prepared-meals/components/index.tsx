import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, ChefHat, ShoppingCart, Package } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePreparedMeals } from '../hooks/usePreparedMeals.supabase';
import type { PreparedMeal } from '../types';
import AddPreparedMealModal from './AddPreparedMealModal';
import { CompactMealHeader } from '@/components/navigation/CompactMealHeader';

export const PreparedMeals: React.FC = () => {
  const { meals, addMeal, updateMeal, deleteMeal } = usePreparedMeals();
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<PreparedMeal | null>(null);

  const handleSave = (data: Omit<PreparedMeal, 'id'>, id?: string) => {
    if (id) updateMeal(id, data);
    else addMeal(data);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <CompactMealHeader
        title="Comidas Preparadas"
        views={[{ key: 'list', label: 'Lista' }]}
        activeViewKey="list"
        onViewChange={() => navigate('/prepared-meals/view/list')}
      >
        {/* Desktop: Icon buttons */}
        <TooltipProvider>
          <div className="hidden md:flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Agregar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Agregar</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/prepared-meals/config')}>
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
            <DropdownMenuItem onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/prepared-meals/config')}>
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
      
      <div className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4 h-full overflow-y-auto">
          {meals.length === 0 ? (
            <p className="text-center text-gray-500">No hay comidas guardadas</p>
          ) : (
            <div className="space-y-2">
              {meals.map(meal => (
                <div key={meal.id} className="flex justify-between items-center border p-2 rounded">
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    {meal.portions !== undefined && (
                      <p className="text-sm text-gray-500">Porciones: {meal.portions}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(meal); setShowModal(true); }}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMeal(meal.id)}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <AddPreparedMealModal
        open={showModal || !!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); setShowModal(open); }}
        onSave={handleSave}
        meal={editing || undefined}
      />
    </div>
  );
};

export default PreparedMeals;
