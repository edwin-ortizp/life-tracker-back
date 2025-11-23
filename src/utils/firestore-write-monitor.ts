// Monitor de escrituras a Firestore para detectar patrones problemáticos
interface WriteMonitor {
  collection: string;
  operation: 'setDoc' | 'updateDoc' | 'addDoc';
  timestamp: Date;
  source: string;
  documentId?: string;
}

class FirestoreWriteMonitor {
  private static instance: FirestoreWriteMonitor;
  private writes: WriteMonitor[] = [];
  private alertThreshold = 50; // Alertar si hay más de 50 escrituras en 5 minutos
  private monitoringWindow = 5 * 60 * 1000; // 5 minutos

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): FirestoreWriteMonitor {
    if (!FirestoreWriteMonitor.instance) {
      FirestoreWriteMonitor.instance = new FirestoreWriteMonitor();
    }
    return FirestoreWriteMonitor.instance;
  }

  logWrite(collection: string, operation: 'setDoc' | 'updateDoc' | 'addDoc', source: string, documentId?: string) {
    if (!import.meta.env.DEV) return;

    const write: WriteMonitor = {
      collection,
      operation,
      timestamp: new Date(),
      source,
      documentId
    };

    this.writes.push(write);
    
    // Limpiar escrituras antiguas (más de 5 minutos)
    const cutoff = new Date(Date.now() - this.monitoringWindow);
    this.writes = this.writes.filter(w => w.timestamp > cutoff);

    // Verificar si hay demasiadas escrituras
    this.checkForExcessiveWrites();
  }

  private checkForExcessiveWrites() {
    const recentWrites = this.writes.filter(w => 
      w.timestamp > new Date(Date.now() - this.monitoringWindow)
    );

    if (recentWrites.length > this.alertThreshold) {
      
      // Agrupar por fuente
      const bySource = this.groupBy(recentWrites, 'source');
        Object.entries(bySource).map(([source, writes]) => ({
          source,
          count: writes.length
        })).sort((a, b) => b.count - a.count)
      );

      // Agrupar por colección
      const byCollection = this.groupBy(recentWrites, 'collection');
        Object.entries(byCollection).map(([collection, writes]) => ({
          collection,
          count: writes.length
        })).sort((a, b) => b.count - a.count)
      );

      // Detectar patrones de escritura repetitiva
      this.detectPatterns(recentWrites);
    }
  }

  private detectPatterns(writes: WriteMonitor[]) {
    // Detectar escrituras muy frecuentes al mismo documento
    const byDocument = new Map<string, WriteMonitor[]>();
    
    writes.forEach(write => {
      const key = `${write.collection}/${write.documentId || 'unknown'}`;
      if (!byDocument.has(key)) {
        byDocument.set(key, []);
      }
      byDocument.get(key)!.push(write);
    });

    byDocument.forEach((docWrites, documentKey) => {
      if (docWrites.length > 10) { // Más de 10 escrituras al mismo documento
        
        // Mostrar frecuencia de escrituras
        const sources = this.groupBy(docWrites, 'source');
        Object.entries(sources).forEach(([source, sourceWrites]) => {
          if (sourceWrites.length > 5) {
            
            // Calcular intervalos entre escrituras
            const timestamps = sourceWrites.map(w => w.timestamp.getTime()).sort();
            const intervals = [];
            for (let i = 1; i < timestamps.length; i++) {
              intervals.push(timestamps[i] - timestamps[i-1]);
            }
            
            if (intervals.length > 0) {
              const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
              
              if (avgInterval < 60000) { // Menos de 1 minuto entre escrituras
                console.error(`    ⚠️ ESCRITURAS MUY FRECUENTES: cada ${Math.round(avgInterval / 1000)}s`);
              }
            }
          }
        });
      }
    });
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private startMonitoring() {
    // Reporte cada 10 minutos en desarrollo
    if (import.meta.env.DEV) {
      setInterval(() => {
        this.generateReport();
      }, 10 * 60 * 1000);
    }
  }

  generateReport() {
    if (this.writes.length === 0) return;

    console.group('📈 Reporte de Escrituras Firestore (últimos 5 min)');
    
    const recentWrites = this.writes.filter(w => 
      w.timestamp > new Date(Date.now() - this.monitoringWindow)
    );
    
    
    if (recentWrites.length > 0) {
      const rate = recentWrites.length / 5; // escrituras por minuto
      
      if (rate > 10) {
      }
    }
    
    console.groupEnd();
  }

  getStats() {
    const recentWrites = this.writes.filter(w => 
      w.timestamp > new Date(Date.now() - this.monitoringWindow)
    );

    return {
      totalWrites: recentWrites.length,
      ratePerMinute: recentWrites.length / 5,
      bySource: this.groupBy(recentWrites, 'source'),
      byCollection: this.groupBy(recentWrites, 'collection')
    };
  }

  clear() {
    this.writes = [];
  }
}

export const firestoreWriteMonitor = FirestoreWriteMonitor.getInstance();
