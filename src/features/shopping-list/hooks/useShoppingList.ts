import { useEffect, useState, useCallback } from 'react';
import { ShoppingItem, ItemStatus } from '../types';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { firestoreLogger } from '@/utils/firestore-logger';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

export const useShoppingList = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);
  
  // Cargar lista de compras (carga única)
  const loadShoppingList = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setStatus('loading');
    setError(null);
    
    try {
      firestoreLogger.logRead('shopping-list', 'useShoppingList.loadShoppingList');
      const q = query(
        collection(db, 'shopping-list'),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setItems([]);
        setStatus('idle');
        return;
      }
      
      const list: ShoppingItem[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();

        const item: ShoppingItem = {
          id: docSnap.id,
          name: data.name || '',
          stock: data.stock || 0,
          toBuy: data.toBuy || 0,
          status: (data.status as ItemStatus) || 'to-buy',
          // Campos opcionales
          ...(data.price !== undefined && { price: data.price }),
          ...(data.category && { category: data.category }),
          ...(data.place && { place: data.place }),
          ...(data.consumeBy && { consumeBy: data.consumeBy }),
          ...(data.nextPurchase && { nextPurchase: data.nextPurchase })
        };
        
        return item;
      });
      
      setItems(list);
      setStatus('idle');
    } catch (err: any) {
      // Si es un error de permisos, mantener los datos actuales pero marcar error
      if (err?.code === 'permission-denied') {
        setError('Error de permisos - Verificar reglas de Firestore');
        setStatus('error');
      } else {
        // Para otros errores, limpiar datos
        setError(err instanceof Error ? err.message : 'Error al cargar');
        setStatus('error');
        setItems([]);
      }
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
      // Verificar si el producto ya existe para evitar duplicados
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

      // Construir datos limpios sin undefined
      const docData: any = {
        userId: user.uid,
        name: item.name,
        stock: Number(item.stock),
        toBuy: Number(item.toBuy),
        status: item.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Agregar campos opcionales solo si tienen valor válido
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
        docData.consumeBy = item.consumeBy.trim();
      }
      if (item.nextPurchase) {
        docData.nextPurchase = true;
      }
      firestoreLogger.logWrite('shopping-list', 'useShoppingList.addItem');
      await addDoc(collection(db, 'shopping-list'), docData);
      
      // Recargar lista después de agregar
      await loadShoppingList();
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al guardar';
      setError(errorMessage);
      setStatus('error');
    }
  };  const updateItem = async (id: string, data: Partial<ShoppingItem>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    // Actualización optimista - actualizar UI inmediatamente
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...data } : item
    ));

    setStatus('saving');
    setError(null);

    try {
      const docRef = doc(db, 'shopping-list', id);

      // Construir datos limpios sin undefined
      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      // Solo incluir campos que tienen valor válido
      if (data.name !== undefined) updateData.name = data.name;
      if (data.stock !== undefined) updateData.stock = Number(data.stock);
      if (data.toBuy !== undefined) updateData.toBuy = Number(data.toBuy);
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
          updateData.consumeBy = data.consumeBy.trim();
        } else {
          // Si consumeBy es undefined o string vacío, eliminarlo del documento
          updateData.consumeBy = null;
        }
      }

      if (data.nextPurchase !== undefined) {
        updateData.nextPurchase = data.nextPurchase;
      }

      firestoreLogger.logWrite('shopping-list', 'useShoppingList.updateItem', id);
      await updateDoc(docRef, updateData);

      setStatus('idle');
    } catch (e) {
      // Revertir cambios en caso de error
      await loadShoppingList();
      const errorMessage = e instanceof Error ? e.message : 'Error al actualizar';
      setError(errorMessage);
      setStatus('error');
    }
  };  const deleteItem = async (id: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    // Actualización optimista - eliminar de UI inmediatamente
    const previousItems = items;
    setItems(prev => prev.filter(item => item.id !== id));

    setStatus('saving');
    setError(null);

    try {
      firestoreLogger.logDelete('shopping-list', 'useShoppingList.deleteItem', id);
      await deleteDoc(doc(db, 'shopping-list', id));

      setStatus('idle');
    } catch (e) {
      // Revertir cambios en caso de error
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

    // Regla 1: Limpiar consumeBy al mover a "Por Comprar"
    // Los productos por comprar no tienen fecha de vencimiento hasta que se compren
    if (newStatus === 'to-buy') {
      updates.consumeBy = undefined;
    }

    // Regla 2: Transferir toBuy a stock al mover a "En Stock"
    // Cuando compramos algo, lo que estaba en "toBuy" pasa a "stock"
    if (newStatus === 'in-stock' && item.toBuy > 0) {
      updates.stock = item.stock + item.toBuy;
      updates.toBuy = 0;
    }

    // Regla 3: Al mover a "Poco Stock", transferir parcialmente toBuy a stock
    if (newStatus === 'low-stock' && item.toBuy > 0) {
      updates.stock = item.stock + item.toBuy;
      updates.toBuy = 0;
    }

    // Regla 4: Al mover de "En Stock" a "Por Comprar", sugerir reposición
    if (newStatus === 'to-buy' && item.status === 'in-stock' && item.toBuy === 0) {
      updates.toBuy = Math.max(1, item.stock); // Sugerir comprar la misma cantidad que había
      updates.stock = 0; // El stock se agotó
    }

    // Regla 5: Al mover a "Poco Stock" desde "Por Comprar", sugerir cantidad mínima
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
