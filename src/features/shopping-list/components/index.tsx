import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical, LayoutList, Kanban } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { exportIngredients } from './ExportIngredientsButton';
import { useShoppingList } from '../hooks/useShoppingList';
import { ShoppingItem } from '../types';
import ItemModal from './ItemModal';
import KanbanView from './KanbanView';
import ListView from './ListView';
import { MealHeader } from '@/components/MealHeader';

export const ShoppingList: React.FC = () => {
  const { items, addItem, updateItem, deleteItem, moveItem } = useShoppingList();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const handleSave = (data: Omit<ShoppingItem, 'id'>, id?: string) => {
    if (id) {
      updateItem(id, data);
    } else {
      addItem(data);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <MealHeader
        title="Lista de Compras"
        subtitle="Organiza tus ingredientes y productos"
      >
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as 'kanban' | 'list')}
          className="mr-2"
        >
          <ToggleGroupItem value="kanban" aria-label="Kanban">
            <Kanban className="w-4 h-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Lista">
            <LayoutList className="w-4 h-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Button onClick={() => setShowModal(true)}>
          Agregar
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportIngredients(items)}>
              Exportar ingredientes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </MealHeader>
      
      <div className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4 h-full overflow-y-auto">
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
            />
          ) : (
            <ListView
              items={items}
              onEdit={setEditingItem}
              onDelete={deleteItem}
              onUpdate={updateItem}
            />
          )}
        </div>
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
    </div>
  );
};

export default ShoppingList;
