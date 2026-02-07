import React, { useState, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { MoreVertical, LayoutList, Kanban, Plus, Download, Play, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/shared/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Calendar, ChefHat, ShoppingCart, Package } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { paths } from '@/core/routes/paths';
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group';
import { ShoppingExportWizard } from './ShoppingExportWizard';
import { useShoppingList } from '../controllers/useShoppingList.supabase';
import { ShoppingItem } from '../models';
import ItemModal from './ItemModal';
import KanbanView from './KanbanView';
import HybridListView from './HybridListView';
import { CompactMealHeader } from '@/shared/components/navigation/CompactMealHeader';

export const ShoppingList: React.FC = () => {
  const { items, addItem, updateItem, deleteItem, moveItem } = useShoppingList();
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const view = useMemo<'kanban' | 'list'>(
    () => (location.pathname.includes(paths.shoppingList.view('kanban')) ? 'kanban' : 'list'),
    [location.pathname]
  );
  const [showExportWizard, setShowExportWizard] = useState(false);

  const handleSave = (data: Omit<ShoppingItem, 'id'>, id?: string) => {
    if (id) {
      updateItem(id, data);
    } else {
      addItem(data);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <CompactMealHeader
        title="Lista de Compras"
        views={[
          { key: 'list', label: 'Lista' },
          { key: 'kanban', label: 'Kanban' },
        ]}
        activeViewKey={view}
        onViewChange={(key) => navigate(paths.shoppingList.view(key))}
      >
        {/* Desktop: Icon buttons */}
        <TooltipProvider>
          <div className="hidden md:flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => v && navigate(paths.shoppingList.view(v))}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="kanban" aria-label="Kanban">
                    <Kanban className="w-4 h-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vista Kanban</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="list" aria-label="Lista">
                    <LayoutList className="w-4 h-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vista Lista</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroup>
            
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowExportWizard(true)}>
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(paths.shoppingList.run)}>
                  <Play className="h-4 w-4" />
                  <span className="sr-only">Ir de compras</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ir de compras</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(paths.shoppingList.config)}>
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
            <DropdownMenuItem onClick={() => setShowExportWizard(true)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar ingredientes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(paths.shoppingList.run)}>
              <Play className="mr-2 h-4 w-4" />
              Ir de compras
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(paths.shoppingList.config)}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {location.pathname !== paths.meal.view('weekly') && (
              <DropdownMenuItem asChild>
                <Link to={paths.meal.view('weekly')} className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Plan de Comidas
                </Link>
              </DropdownMenuItem>
            )}
            {!location.pathname.startsWith(paths.shoppingList.base) && (
              <DropdownMenuItem asChild>
                <Link to={paths.shoppingList.view('list')} className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Lista de Compras
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== paths.recipes.view('list') && (
              <DropdownMenuItem asChild>
                <Link to={paths.recipes.view('list')} className="flex items-center">
                  <ChefHat className="mr-2 h-4 w-4" />
                  Recetas
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== paths.preparedMeals.view('list') && (
              <DropdownMenuItem asChild>
                <Link to={paths.preparedMeals.view('list')} className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Comidas Preparadas
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CompactMealHeader>
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No hay elementos en tu lista</p>
            <p className="text-sm">Haz clic en "Agregar" para comenzar</p>
          </div>
        ) : view === 'kanban' ? (
          <KanbanView
            items={items}
            onMove={moveItem}
            onView={setEditingItem}
            onToggleNext={item =>
              updateItem(item.id, { nextPurchase: !item.nextPurchase })
            }
            onUpdate={updateItem}
          />
        ) : (
          <HybridListView
            items={items}
            onEdit={setEditingItem}
            onDelete={deleteItem}
            onUpdate={updateItem}
          />
        )}
      </div>
      
      <ItemModal
        open={showModal || !!editingItem}
        onOpenChange={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        onDelete={id => deleteItem(id)}
        item={editingItem || undefined}
      />
      
      <ShoppingExportWizard
        open={showExportWizard}
        onOpenChange={setShowExportWizard}
      />
    </div>
  );
};

export default ShoppingList;
