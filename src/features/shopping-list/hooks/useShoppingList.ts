import { useEffect, useState } from 'react';
import { ShoppingItem, ItemStatus } from '../types';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
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
  const [error, setError] = useState<string | null>(null);  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    setStatus('loading');
    
    const q = query(
      collection(db, 'shopping-list'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(
      q, { includeMetadataChanges: true },
      snapshot => {
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
            quantity: data.quantity || 0,
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
      },
      err => {
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
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

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
        const newQuantity = existing.quantity + Number(item.quantity);

        if (existing.status === 'low-stock') {
          await updateItem(existing.id, { quantity: newQuantity });
        } else if (existing.status === 'to-buy') {
          await updateItem(existing.id, { quantity: newQuantity, status: 'in-stock' });
        } else {
          await updateItem(existing.id, { quantity: newQuantity });
        }

        setStatus('idle');
        return;
      }

      // Construir datos limpios sin undefined
      const docData: any = {
        userId: user.uid,
        name: item.name,
        quantity: Number(item.quantity),
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
      await addDoc(collection(db, 'shopping-list'), docData);
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
      if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
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

      if (data.consumeBy !== undefined && typeof data.consumeBy === 'string' && data.consumeBy.trim() !== '') {
        updateData.consumeBy = data.consumeBy.trim();
      }

      if (data.nextPurchase !== undefined) {
        updateData.nextPurchase = data.nextPurchase;
      }

      await updateDoc(docRef, updateData);
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al actualizar';
      setError(errorMessage);
      setStatus('error');
    }
  };  const deleteItem = async (id: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }
    
    setStatus('saving');
    setError(null);

    try {
      await deleteDoc(doc(db, 'shopping-list', id));
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al eliminar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const moveItem = (id: string, status: ItemStatus) => {
    updateItem(id, { status });
  };

  return { items, status, error, addItem, updateItem, deleteItem, moveItem };
};
