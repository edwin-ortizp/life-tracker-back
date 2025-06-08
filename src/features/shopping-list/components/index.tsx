import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <Card className="w-full h-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">Lista de Compras</h3>
          <Button onClick={() => setShowModal(true)}>Agregar</Button>
        </div>
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban">
            <KanbanView items={items} onMove={moveItem} onView={setEditingItem} />
          </TabsContent>
          <TabsContent value="list">
            <ListView items={items} onEdit={setEditingItem} onDelete={deleteItem} />
          </TabsContent>
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
