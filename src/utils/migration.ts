import { collection, getDocs, doc, updateDoc, deleteField, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

export async function migrateQuantityToStock(userId: string) {
  try {
    console.log('Starting migration: quantity → stock');
    
    // Get all documents from shopping-list collection for the current user
    const shoppingListRef = collection(db, 'shopping-list');
    const q = query(shoppingListRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    console.log(`Found ${snapshot.size} documents to migrate`);
    
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
          console.log(`✓ Migrated document ${docSnapshot.id}: quantity(${data.quantity}) → stock(${data.quantity})`);
        } else {
          console.log(`⚠ Document ${docSnapshot.id} doesn't have quantity field, skipping`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating document ${docSnapshot.id}:`, error);
      }
    }
    
    console.log('\n=== Migration Complete ===');
    console.log(`Successfully migrated: ${migratedCount} documents`);
    console.log(`Errors: ${errorCount} documents`);
    console.log(`Total processed: ${snapshot.size} documents`);
    
    return { migratedCount, errorCount, total: snapshot.size };
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}