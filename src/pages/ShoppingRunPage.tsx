import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShoppingList } from '@/features/shopping-list/hooks/useShoppingList.supabase';
import { useShoppingTimer } from '@/features/shopping-list/hooks/useShoppingTimer';
import { ShoppingItem, ItemUnit } from '@/features/shopping-list/types';
import { PLACES } from '@/features/shopping-list/utils/places';
import { Play, Pause, Square, ShoppingCart, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ShoppingItemWithPurchased extends ShoppingItem {
  purchased: boolean;
}

const unitLabels: Record<ItemUnit, string> = {
  units: 'u',
  grams: 'g',
  milliliters: 'ml'
};

const getRandomBackground = (storeName: string) => {
  const backgrounds = [
    'bg-gradient-to-br from-slate-800 via-slate-900 to-black',
    'bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900',
    'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900',
    'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900',
    'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900',
    'bg-gradient-to-br from-teal-900 via-cyan-900 to-slate-900',
    'bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900',
    'bg-gradient-to-br from-orange-900 via-red-900 to-slate-900',
  ];

  // Use store name as seed for consistent but random selection
  const hash = storeName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const index = hash % backgrounds.length;
  return backgrounds[index];
};

export default function ShoppingRunPage() {
  const navigate = useNavigate();
  const { items, updateItem } = useShoppingList();

  const [selectedStore, setSelectedStore] = useState<string>('');
  const [showStoreModal, setShowStoreModal] = useState(true);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItemWithPurchased[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const {
    formattedTime,
    isActive,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeSession
  } = useShoppingTimer({
    onComplete: () => navigate(-1)
  });

  // Filter items for selected store with toBuy > 0
  const storeItems = useMemo(() => {
    if (!selectedStore) return [];

    return items
      .filter(item => item.place === selectedStore && item.toBuy > 0)
      .map(item => ({ ...item, purchased: false }));
  }, [items, selectedStore]);

  // Initialize shopping items when store is selected
  useEffect(() => {
    setShoppingItems(storeItems);
  }, [storeItems]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalEstimated = shoppingItems.reduce((sum, item) => {
      if (item.price) {
        return sum + (item.price * item.toBuy);
      }
      return sum;
    }, 0);

    const totalPurchased = shoppingItems.reduce((sum, item) => {
      if (item.purchased && item.price) {
        return sum + (item.price * item.toBuy);
      }
      return sum;
    }, 0);

    const totalRemaining = shoppingItems.reduce((sum, item) => {
      if (!item.purchased && item.price) {
        return sum + (item.price * item.toBuy);
      }
      return sum;
    }, 0);

    return { totalEstimated, totalPurchased, totalRemaining };
  }, [shoppingItems]);

  const backgroundClass = useMemo(() =>
    getRandomBackground(selectedStore),
    [selectedStore]
  );

  const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

  const handleStoreSelect = (store: string) => {
    setSelectedStore(store);
    setShowStoreModal(false);
    startTimer();
  };

  const toggleItemPurchased = (itemId: string) => {
    setShoppingItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, purchased: !item.purchased }
          : item
      )
    );
  };

  const toggleAllPurchased = (value: boolean) => {
    setShoppingItems(prev => prev.map(item => ({ ...item, purchased: value })));
  };

  const handleApplyPurchases = async () => {
    const purchasedItems = shoppingItems.filter(item => item.purchased);
    if (purchasedItems.length === 0) return;

    setIsApplying(true);
    try {
      await Promise.all(
        purchasedItems.map(item =>
          updateItem(item.id, {
            stock: item.stock + item.toBuy,
            toBuy: 0,
            status: 'in-stock'
          })
        )
      );
      setShoppingItems(prev =>
        prev.map(item =>
          item.purchased
            ? { ...item, stock: item.stock + item.toBuy, toBuy: 0, status: 'in-stock' }
            : item
        )
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleFinishShopping = async () => {
    await handleApplyPurchases();
    completeSession();
  };

  // Store selection modal
  if (showStoreModal) {
    return (
      <Dialog open={showStoreModal} onOpenChange={setShowStoreModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿En qué tienda vas a comprar?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select onValueChange={handleStoreSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una tienda" />
              </SelectTrigger>
              <SelectContent>
                {PLACES.map(place => (
                  <SelectItem key={place} value={place}>
                    {place}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // No items to buy in selected store
  if (shoppingItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center space-y-4">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400" />
          <h1 className="text-3xl font-bold">No hay productos para comprar</h1>
          <p className="text-xl text-gray-300">
            No tienes productos marcados para comprar en {selectedStore}
          </p>
          <Button
            variant="outline"
            className="text-white border-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${backgroundClass} text-white`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20 text-lg font-semibold"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver
        </Button>

        <div className="text-center">
          <div className="text-sm text-white/80 mb-1">{selectedStore}</div>
          <div className="text-3xl font-mono font-bold bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
            {formattedTime}
          </div>
        </div>

        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Timer Controls */}
      <div className="flex gap-2 justify-center p-4 bg-black/10">
        {!isActive ? (
          <Button
            onClick={startTimer}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 font-semibold"
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                onClick={resumeTimer}
                className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 font-semibold"
              >
                <Play className="w-4 h-4 mr-2" />
                Reanudar
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 font-semibold"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}
            <Button
              onClick={stopTimer}
              className="bg-red-700 hover:bg-red-800 text-white px-6 py-2 font-semibold"
            >
              <Square className="w-4 h-4 mr-2" />
              Detener
            </Button>
          </>
        )}
      </div>

      {/* Shopping List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <Button
            variant="outline"
            className="text-white border-white/40 hover:bg-white/10"
            onClick={() => toggleAllPurchased(true)}
          >
            Marcar todos
          </Button>
          <Button
            variant="outline"
            className="text-white border-white/40 hover:bg-white/10"
            onClick={() => toggleAllPurchased(false)}
          >
            Limpiar todos
          </Button>
        </div>
        {shoppingItems.map((item) => (
          <div
            key={item.id}
            className={`bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg p-4 transition-all duration-300 ${
              item.purchased ? 'opacity-60 bg-green-900/20' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={item.purchased}
                onCheckedChange={() => toggleItemPurchased(item.id)}
                className="scale-125"
              />

              <div className="flex-1">
                <div className={`text-lg font-medium ${item.purchased ? 'line-through text-white/70' : ''}`}>
                  {item.name}
                </div>
                <div className="text-sm text-white/80">
                  Cantidad: {item.toBuy} {unitLabels[(item.unit || 'units') as ItemUnit]}
                  {item.price && (
                    <span className="ml-4">
                      Precio unitario: {formatter.format(item.price)}
                    </span>
                  )}
                </div>
              </div>

              {item.price && (
                <div className={`text-right ${item.purchased ? 'line-through text-white/70' : ''}`}>
                  <div className="text-lg font-bold">
                    {formatter.format(item.price * item.toBuy)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with Totals */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-white/20 p-4 space-y-3">
        <div className="flex justify-between text-sm text-white/80">
          <span>Total estimado:</span>
          <span>{formatter.format(totals.totalEstimated)}</span>
        </div>
        <div className="flex justify-between text-sm text-green-400">
          <span>Ya comprado:</span>
          <span>{formatter.format(totals.totalPurchased)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-white/20 pt-3">
          <span>Falta por comprar:</span>
          <span>{formatter.format(totals.totalRemaining)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 text-lg font-semibold"
            onClick={handleApplyPurchases}
            disabled={isApplying}
          >
            {isApplying ? 'Aplicando...' : 'Aplicar compras'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 text-lg font-semibold"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Terminar Compras
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Terminar Compras</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres terminar la sesión de compras?
                  El cronómetro se detendrá y volverás a la vista anterior.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuar comprando</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleFinishShopping}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sí, terminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
