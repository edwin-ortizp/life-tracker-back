import { useEffect, useState } from 'react';
import { ShoppingItem, ItemStatus } from '../types';

const STORAGE_KEY = 'shopping-list-items';

export const useShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<ShoppingItem, 'id'>) => {
    const newItem: ShoppingItem = { ...item, id: crypto.randomUUID() };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, data: Partial<ShoppingItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...data } : it)));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const moveItem = (id: string, status: ItemStatus) => {
    updateItem(id, { status });
  };

  return { items, addItem, updateItem, deleteItem, moveItem };
};
