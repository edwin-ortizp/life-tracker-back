import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ExportIngredientsButton from './ExportIngredientsButton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useShoppingList } from '../hooks/useShoppingList';
import { ShoppingItem } from '../types';
import ItemModal from './ItemModal';
import KanbanView from './KanbanView';
import ListView from './ListView';

export const ShoppingList: React.FC = () => {
  const { items, addItem, updateItem, deleteItem, moveItem } = useShoppingList();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const handleSave = (data: Omit<ShoppingItem, 'id'>, id?: string) => {
    if (id) {
      updateItem(id, data);
    } else {
      addItem(data);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardContent className="p-4 space-y-4 overflow-y-auto flex-1">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">Lista de Compras</h3>
          <div className="flex gap-2">
            <ExportIngredientsButton items={items} />
            <Button onClick={() => setShowModal(true)}>
              Agregar
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No hay elementos en tu lista</p>
              <p className="text-sm">Haz clic en "Agregar" para comenzar</p>
            </div>
          ) : (
            <>
              <TabsContent value="kanban">
                <KanbanView
                  items={items}
                  onMove={moveItem}
                  onView={setEditingItem}
                />
              </TabsContent>
              <TabsContent value="list">
                <ListView
                  items={items}
                  onEdit={setEditingItem}
                  onDelete={deleteItem}
                  onUpdate={updateItem}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
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
    </Card>
  );
};

export default ShoppingList;
