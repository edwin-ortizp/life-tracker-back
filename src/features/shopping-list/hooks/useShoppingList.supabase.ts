import { useEffect, useState, useCallback } from 'react';
import { ShoppingItem, ItemStatus } from '../types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const useShoppingList = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadShoppingList = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setItems([]);
        setStatus('idle');
        return;
      }

      const list: ShoppingItem[] = data.map(row => ({
        id: row.id,
        name: row.name || '',
        stock: row.stock || 0,
        toBuy: row.to_buy || 0,
        status: (row.status as ItemStatus) || 'to-buy',
        ...(row.price !== undefined && { price: row.price }),
        ...(row.category && { category: row.category }),
        ...(row.place && { place: row.place }),
        ...(row.consume_by && { consumeBy: row.consume_by }),
        ...(row.next_purchase && { nextPurchase: row.next_purchase })
      }));

      setItems(list);
      setStatus('idle');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
      setStatus('error');
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  const addItem = async (item: Omit<ShoppingItem, 'id'>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const existing = items.find(
        i => i.name.toLowerCase() === item.name.toLowerCase()
      );

      if (existing) {
        const newStock = existing.stock + Number(item.stock);

        if (existing.status === 'low-stock') {
          await updateItem(existing.id, { stock: newStock });
        } else if (existing.status === 'to-buy') {
          await updateItem(existing.id, { stock: newStock, status: 'in-stock' });
        } else {
          await updateItem(existing.id, { stock: newStock });
        }

        setStatus('idle');
        return;
      }

      const docData: any = {
        user_id: user.id,
        name: item.name,
        stock: Number(item.stock),
        to_buy: Number(item.toBuy),
        status: item.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (item.price !== undefined && item.price !== null && !isNaN(Number(item.price))) {
        docData.price = Number(item.price);
      }

      if (item.category && typeof item.category === 'string' && item.category.trim() !== '') {
        docData.category = item.category.trim();
      }

      if (item.place && typeof item.place === 'string' && item.place.trim() !== '') {
        docData.place = item.place.trim();
      }

      if (item.consumeBy && typeof item.consumeBy === 'string' && item.consumeBy.trim() !== '') {
        docData.consume_by = item.consumeBy.trim();
      }

      if (item.nextPurchase) {
        docData.next_purchase = true;
      }

      const { error: insertError } = await supabase
        .from('shopping_items')
        .insert(docData);

      if (insertError) throw insertError;

      await loadShoppingList();
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al guardar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const updateItem = async (id: string, data: Partial<ShoppingItem>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...data } : item
    ));

    setStatus('saving');
    setError(null);

    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.stock !== undefined) updateData.stock = Number(data.stock);
      if (data.toBuy !== undefined) updateData.to_buy = Number(data.toBuy);
      if (data.status !== undefined) updateData.status = data.status;

      if (data.price !== undefined && data.price !== null && !isNaN(Number(data.price))) {
        updateData.price = Number(data.price);
      }

      if (data.category !== undefined && typeof data.category === 'string' && data.category.trim() !== '') {
        updateData.category = data.category.trim();
      }

      if (data.place !== undefined && typeof data.place === 'string' && data.place.trim() !== '') {
        updateData.place = data.place.trim();
      }

      if (data.consumeBy !== undefined) {
        if (typeof data.consumeBy === 'string' && data.consumeBy.trim() !== '') {
          updateData.consume_by = data.consumeBy.trim();
        } else {
          updateData.consume_by = null;
        }
      }

      if (data.nextPurchase !== undefined) {
        updateData.next_purchase = data.nextPurchase;
      }

      const { error: updateError } = await supabase
        .from('shopping_items')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      setStatus('idle');
    } catch (e) {
      await loadShoppingList();
      const errorMessage = e instanceof Error ? e.message : 'Error al actualizar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    const previousItems = items;
    setItems(prev => prev.filter(item => item.id !== id));

    setStatus('saving');
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setStatus('idle');
    } catch (e) {
      setItems(previousItems);
      const errorMessage = e instanceof Error ? e.message : 'Error al eliminar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const moveItem = (id: string, newStatus: ItemStatus) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const updates: Partial<ShoppingItem> = { status: newStatus };

    if (newStatus === 'to-buy') {
      updates.consumeBy = undefined;
    }

    if (newStatus === 'in-stock' && item.toBuy > 0) {
      updates.stock = item.stock + item.toBuy;
      updates.toBuy = 0;
    }

    if (newStatus === 'low-stock' && item.toBuy > 0) {
      updates.stock = item.stock + item.toBuy;
      updates.toBuy = 0;
    }

    if (newStatus === 'to-buy' && item.status === 'in-stock' && item.toBuy === 0) {
      updates.toBuy = Math.max(1, item.stock);
      updates.stock = 0;
    }

    if (newStatus === 'low-stock' && item.status === 'to-buy') {
      if (item.toBuy > 0 && item.stock === 0) {
        updates.stock = item.toBuy;
        updates.toBuy = 0;
      } else if (item.stock === 0) {
        updates.stock = 1;
      }
    }

    updateItem(id, updates);
  };

  return { items, status, error, addItem, updateItem, deleteItem, moveItem, loadShoppingList };
};
