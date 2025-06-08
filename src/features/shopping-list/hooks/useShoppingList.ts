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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setStatus('loading');
    const q = query(
      collection(db, 'shopping-list'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: ShoppingItem[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name,
            quantity: data.quantity,
            price: data.price,
            category: data.category,
            place: data.place,
            status: data.status as ItemStatus
          };
        });
        setItems(list);
        setStatus('idle');
      },
      err => {
        setError(err instanceof Error ? err.message : 'Error al cargar');
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addItem = async (item: Omit<ShoppingItem, 'id'>) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      await addDoc(collection(db, 'shopping-list'), {
        userId: user.uid,
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const updateItem = async (id: string, data: Partial<ShoppingItem>) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const docRef = doc(db, 'shopping-list', id);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      await deleteDoc(doc(db, 'shopping-list', id));
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const moveItem = (id: string, status: ItemStatus) => {
    updateItem(id, { status });
  };

  return { items, status, error, addItem, updateItem, deleteItem, moveItem };
};
