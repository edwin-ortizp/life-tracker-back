import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, doc, updateDoc, deleteField, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { Database, AlertTriangle } from 'lucide-react';

export const MigrationButton: React.FC = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const migrateQuantityToStock = async () => {
    if (!user) {
      setResult({ success: false, message: 'Error: Usuario no autenticado' });
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      console.log('Starting migration: quantity → stock');
      
      // Get all documents from shopping-list collection for the current user
      const shoppingListRef = collection(db, 'shopping-list');
      const q = query(shoppingListRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      console.log(`Found ${snapshot.size} documents to migrate`);
      
      let migratedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      // Process each document
      for (const docSnapshot of snapshot.docs) {
        try {
          const data = docSnapshot.data();
          
          // Check if document has quantity field
          if ('quantity' in data) {
            const docRef = doc(db, 'shopping-list', docSnapshot.id);
            
            // Add stock field with quantity value, then remove quantity field
            await updateDoc(docRef, {
              stock: data.quantity,
              quantity: deleteField()
            });
            
            migratedCount++;
            console.log(`✓ Migrated document ${docSnapshot.id}: quantity(${data.quantity}) → stock(${data.quantity})`);
          } else {
            skippedCount++;
            console.log(`⚠ Document ${docSnapshot.id} doesn't have quantity field, skipping`);
          }
        } catch (error) {
          errorCount++;
          console.error(`✗ Error migrating document ${docSnapshot.id}:`, error);
        }
      }
      
      console.log('\n=== Migration Complete ===');
      console.log(`Successfully migrated: ${migratedCount} documents`);
      console.log(`Skipped: ${skippedCount} documents`);
      console.log(`Errors: ${errorCount} documents`);
      console.log(`Total processed: ${snapshot.size} documents`);
      
      if (migratedCount > 0) {
        setResult({ 
          success: true, 
          message: `✅ Migración exitosa: ${migratedCount} documentos migrados (${skippedCount} ya migrados, ${errorCount} errores)` 
        });
      } else if (skippedCount > 0) {
        setResult({ 
          success: true, 
          message: `ℹ️ Migración ya completada: ${skippedCount} documentos ya tenían el campo 'stock'` 
        });
      } else {
        setResult({ 
          success: true, 
          message: `ℹ️ No se encontraron documentos para migrar` 
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Migration failed:', error);
      setResult({ 
        success: false, 
        message: `❌ Error en la migración: ${errorMessage}` 
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!user) {
    return null; // No mostrar si no está autenticado
  }

  return (
    <div className="mb-4 p-3 border rounded-lg bg-yellow-50 border-yellow-200">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Migración de datos requerida</h3>
      </div>
      
      <p className="text-sm text-yellow-700 mb-3">
        Se requiere migrar el campo "quantity" a "stock" en tus datos de lista de compras.
        Esta acción solo afectará tus datos y es necesaria para el correcto funcionamiento.
      </p>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={migrateQuantityToStock} 
          disabled={isRunning}
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <Database className="h-4 w-4 mr-2" />
          {isRunning ? 'Migrando...' : 'Ejecutar migración'}
        </Button>
      </div>
      
      {result && (
        <Alert className={`mt-3 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
            {result.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};