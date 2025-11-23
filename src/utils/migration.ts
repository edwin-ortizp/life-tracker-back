import { collection, getDocs, doc, updateDoc, deleteField, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

export async function migrateQuantityToStock(userId: string) {
  try {
    
    // Get all documents from shopping-list collection for the current user
    const shoppingListRef = collection(db, 'shopping-list');
    const q = query(shoppingListRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    
    let migratedCount = 0;
    let errorCount = 0;
    
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
        } else {
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating document ${docSnapshot.id}:`, error);
      }
    }
    
    
    return { migratedCount, errorCount, total: snapshot.size };
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}