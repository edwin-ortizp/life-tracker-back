// Script de migración: dueDate → startDate
// Ejecutar con: node scripts/migrate-duedate-to-startdate.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// IMPORTANTE: Copia tu configuración de Firebase aquí
const firebaseConfig = {
  // TODO: Reemplazar con tus credenciales de Firebase
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateTasks() {
  console.log('🚀 Iniciando migración de dueDate a startDate...\n');

  try {
    const tasksRef = collection(db, 'tasks');
    const snapshot = await getDocs(tasksRef);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const taskDoc of snapshot.docs) {
      const data = taskDoc.data();

      try {
        // Si tiene dueDate pero NO tiene startDate, migrar
        if (data.dueDate && !data.startDate) {
          await updateDoc(doc(db, 'tasks', taskDoc.id), {
            startDate: data.dueDate,
            // Opcionalmente, puedes eliminar dueDate:
            // dueDate: null
          });

          console.log(`✅ Migrada: ${data.title || taskDoc.id}`);
          migrated++;
        } else if (data.startDate) {
          console.log(`⏭️  Ya tiene startDate: ${data.title || taskDoc.id}`);
          skipped++;
        } else {
          console.log(`⚠️  Sin fecha: ${data.title || taskDoc.id}`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error en ${taskDoc.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Migradas: ${migrated}`);
    console.log(`   ⏭️  Omitidas: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📝 Total: ${snapshot.docs.length}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }

  console.log('\n✨ Migración completada');
  process.exit(0);
}

migrateTasks();
