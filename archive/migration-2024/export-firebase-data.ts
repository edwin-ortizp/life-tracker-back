/**
 * Script de Exportación: Firebase → JSON
 *
 * Exporta TODA la data de Firestore a un archivo JSON
 * para posterior importación a PostgreSQL/Supabase.
 *
 * Uso:
 *   npx tsx scripts/export-firebase-data.ts
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

// Inicializar Firebase Admin SDK
const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), 'firebase-admin-key.json'), 'utf8')
);

// Colecciones a exportar
const COLLECTIONS = [
  'tasks',
  'shopping-list',
  'pomodoro',
  'moods',
  'energy',
  'water',
  'exercises',
  'journal',
  'habits',
  'meals',
  'negative-habits',
  'goals',
  'recipes',
  'prepared-meals',
];

interface ExportData {
  [collection: string]: any[];
}

interface ExportMetadata {
  exportDate: string;
  totalCollections: number;
  totalDocuments: number;
  collections: {
    [key: string]: {
      documentCount: number;
    };
  };
}

/**
 * Convierte Timestamps de Firestore Admin a formato serializable
 */
function convertFirestoreTimestamps(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es un Firestore Timestamp de Admin SDK
  if (obj?._seconds !== undefined && obj?._nanoseconds !== undefined) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
  }

  // Si es un Firestore Timestamp regular (por si acaso)
  if (obj?.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }

  // Si es un array
  if (Array.isArray(obj)) {
    return obj.map(convertFirestoreTimestamps);
  }

  // Si es un objeto
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertFirestoreTimestamps(value);
    }
    return converted;
  }

  return obj;
}

async function exportAllData() {
  console.log('🔥 Iniciando exportación de Firebase...\n');

  // Inicializar Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });

  const db = admin.firestore();

  const exportData: ExportData = {};
  const metadata: ExportMetadata = {
    exportDate: new Date().toISOString(),
    totalCollections: COLLECTIONS.length,
    totalDocuments: 0,
    collections: {},
  };

  // Exportar cada colección
  for (const collectionName of COLLECTIONS) {
    console.log(`📦 Exportando "${collectionName}"...`);

    try {
      const snapshot = await db.collection(collectionName).get();
      const documents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...convertFirestoreTimestamps(data),
          _firestoreExport: true,
        };
      });

      exportData[collectionName] = documents;
      metadata.collections[collectionName] = {
        documentCount: snapshot.size,
      };
      metadata.totalDocuments += snapshot.size;

      console.log(`   ✓ ${snapshot.size} documentos exportados`);
    } catch (error) {
      console.error(`   ✗ Error exportando "${collectionName}":`, error);
      exportData[collectionName] = [];
      metadata.collections[collectionName] = {
        documentCount: 0,
      };
    }
  }

  // Guardar archivos
  const outputDir = join(process.cwd(), 'firebase-exports');

  // Crear directorio si no existe
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const dataFile = join(outputDir, `firebase-export-${timestamp}.json`);
  const metadataFile = join(outputDir, `export-metadata-${timestamp}.json`);

  // Guardar data
  writeFileSync(dataFile, JSON.stringify(exportData, null, 2));
  console.log(`\n✅ Data exportada: ${dataFile}`);

  // Guardar metadata
  writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  console.log(`✅ Metadata exportada: ${metadataFile}`);

  // Resumen
  console.log('\n📊 Resumen de exportación:');
  console.log(`   Total colecciones: ${metadata.totalCollections}`);
  console.log(`   Total documentos:  ${metadata.totalDocuments}`);
  console.log(`   Tamaño archivo:    ${(statSync(dataFile).size / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n🎉 Exportación completada exitosamente!');
}

// Ejecutar exportación
exportAllData().catch(error => {
  console.error('❌ Error fatal en exportación:', error);
  process.exit(1);
});
