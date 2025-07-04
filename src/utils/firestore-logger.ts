// Utility to log Firestore operations for debugging quota issues
interface FirestoreOperation {
  type: 'read' | 'write' | 'delete';
  collection: string;
  documentId?: string;
  timestamp: Date;
  source: string; // Which hook/component triggered the operation
}

class FirestoreLogger {
  private static instance: FirestoreLogger;
  private operations: FirestoreOperation[] = [];
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = import.meta.env.DEV;
  }

  static getInstance(): FirestoreLogger {
    if (!FirestoreLogger.instance) {
      FirestoreLogger.instance = new FirestoreLogger();
    }
    return FirestoreLogger.instance;
  }

  logRead(collection: string, source: string, documentId?: string) {
    if (!this.isEnabled) return;
    
    const operation: FirestoreOperation = {
      type: 'read',
      collection,
      documentId,
      timestamp: new Date(),
      source
    };
    
    this.operations.push(operation);
    console.log(`🔍 [Firestore Read] ${collection}${documentId ? `/${documentId}` : ''} from ${source}`, operation);
  }

  logWrite(collection: string, source: string, documentId?: string) {
    if (!this.isEnabled) return;
    
    const operation: FirestoreOperation = {
      type: 'write',
      collection,
      documentId,
      timestamp: new Date(),
      source
    };
    
    this.operations.push(operation);
    console.log(`✏️ [Firestore Write] ${collection}${documentId ? `/${documentId}` : ''} from ${source}`, operation);
  }

  logDelete(collection: string, source: string, documentId?: string) {
    if (!this.isEnabled) return;
    
    const operation: FirestoreOperation = {
      type: 'delete',
      collection,
      documentId,
      timestamp: new Date(),
      source
    };
    
    this.operations.push(operation);
    console.log(`🗑️ [Firestore Delete] ${collection}${documentId ? `/${documentId}` : ''} from ${source}`, operation);
  }

  getOperations(): FirestoreOperation[] {
    return [...this.operations];
  }

  getOperationsBySource(source: string): FirestoreOperation[] {
    return this.operations.filter(op => op.source === source);
  }

  getOperationsByCollection(collection: string): FirestoreOperation[] {
    return this.operations.filter(op => op.collection === collection);
  }

  getOperationsSummary(): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    
    this.operations.forEach(op => {
      const key = `${op.type}-${op.collection}`;
      summary[key] = (summary[key] || 0) + 1;
    });
    
    return summary;
  }

  logSummary() {
    if (!this.isEnabled) return;
    
    const summary = this.getOperationsSummary();
    console.group('📊 Firestore Operations Summary');
    Object.entries(summary).forEach(([key, count]) => {
      console.log(`${key}: ${count} operations`);
    });
    console.groupEnd();
  }

  clear() {
    this.operations = [];
  }
}

export const firestoreLogger = FirestoreLogger.getInstance();