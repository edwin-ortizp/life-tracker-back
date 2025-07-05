// Extiende la interfaz Window para incluir firebase
declare global {
  interface Window {
    firebase?: any;
  }
}

// Herramienta de diagnóstico para detectar problemas de escrituras excesivas
export class FirestoreWriteDiagnostic {
  private static originalSetDoc: any;
  private static originalUpdateDoc: any;
  private static originalAddDoc: any;
  private static writeCount = 0;
  private static writeLog: Array<{
    timestamp: Date;
    collection: string;
    docId?: string;
    operation: string;
    stack: string;
  }> = [];

  static startDiagnostic() {
    if (typeof window === 'undefined') return;

    console.log('🔍 Iniciando diagnóstico de escrituras Firestore...');
    
    // Interceptar setDoc
    if (window.firebase?.firestore?.setDoc && !this.originalSetDoc) {
      this.originalSetDoc = window.firebase.firestore.setDoc;
      window.firebase.firestore.setDoc = this.wrapWriteFunction('setDoc', this.originalSetDoc);
    }

    // Interceptar updateDoc
    if (window.firebase?.firestore?.updateDoc && !this.originalUpdateDoc) {
      this.originalUpdateDoc = window.firebase.firestore.updateDoc;
      window.firebase.firestore.updateDoc = this.wrapWriteFunction('updateDoc', this.originalUpdateDoc);
    }

    // Interceptar addDoc
    if (window.firebase?.firestore?.addDoc && !this.originalAddDoc) {
      this.originalAddDoc = window.firebase.firestore.addDoc;
      window.firebase.firestore.addDoc = this.wrapWriteFunction('addDoc', this.originalAddDoc);
    }

    // Monitoreo cada 30 segundos
    setInterval(() => {
      this.reportCurrentStats();
    }, 30000);

    console.log('✅ Diagnóstico iniciado. Usa FirestoreWriteDiagnostic.getReport() para ver estadísticas.');
  }

  private static wrapWriteFunction(operation: string, originalFunction: any) {
    return (...args: any[]) => {
      this.writeCount++;
      
      // Extraer información del documento
      const docRef = args[0];
      const collection = docRef?.path?.split('/')[0] || 'unknown';
      const docId = docRef?.id;
      
      // Capturar stack trace
      const stack = new Error().stack || '';
      
      this.writeLog.push({
        timestamp: new Date(),
        collection,
        docId,
        operation,
        stack: this.extractRelevantStack(stack)
      });

      // Mantener solo los últimos 100 writes para evitar memory leaks
      if (this.writeLog.length > 100) {
        this.writeLog = this.writeLog.slice(-100);
      }

      // Alertar si hay demasiadas escrituras
      const recentWrites = this.writeLog.filter(w => 
        w.timestamp > new Date(Date.now() - 60000) // último minuto
      );

      if (recentWrites.length > 20) {
        console.warn(`🚨 ALERTA: ${recentWrites.length} escrituras en el último minuto!`);
        this.analyzeRecentWrites(recentWrites);
      }

      return originalFunction.apply(this, args);
    };
  }

  private static extractRelevantStack(stack: string): string {
    const lines = stack.split('\n');
    // Encontrar la primera línea que no sea del wrapper o Firebase
    const relevantLine = lines.find(line => 
      !line.includes('wrapWriteFunction') &&
      !line.includes('firebase') &&
      line.includes('at ')
    );
    return relevantLine || 'unknown';
  }

  private static analyzeRecentWrites(writes: typeof this.writeLog) {
    // Agrupar por colección
    const byCollection = this.groupBy(writes, 'collection');
    console.warn('📊 Escrituras por colección (último minuto):');
    Object.entries(byCollection).forEach(([collection, collectionWrites]) => {
      console.warn(`  ${collection}: ${collectionWrites.length} escrituras`);
    });

    // Agrupar por fuente (stack trace)
    const bySource = this.groupBy(writes, 'stack');
    console.warn('📍 Fuentes más activas:');
    Object.entries(bySource)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 5)
      .forEach(([source, sourceWrites]) => {
        console.warn(`  ${sourceWrites.length}x: ${source.substring(0, 100)}...`);
      });

    // Detectar escrituras al mismo documento
    const byDoc = new Map<string, typeof writes>();
    writes.forEach(write => {
      const key = `${write.collection}/${write.docId}`;
      if (!byDoc.has(key)) byDoc.set(key, []);
      byDoc.get(key)!.push(write);
    });

    byDoc.forEach((docWrites, docKey) => {
      if (docWrites.length > 5) {
        console.warn(`🔥 ${docWrites.length} escrituras al documento ${docKey}`);
      }
    });
  }

  private static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private static reportCurrentStats() {
    const now = new Date();
    const last5Min = this.writeLog.filter(w => w.timestamp > new Date(now.getTime() - 5 * 60 * 1000));
    const last1Min = this.writeLog.filter(w => w.timestamp > new Date(now.getTime() - 60 * 1000));

    if (last5Min.length > 0) {
      console.log(`📈 Estadísticas de escrituras:`);
      console.log(`  Últimos 5 min: ${last5Min.length} escrituras (${(last5Min.length / 5).toFixed(1)}/min)`);
      console.log(`  Último minuto: ${last1Min.length} escrituras`);
      console.log(`  Total desde inicio: ${this.writeCount} escrituras`);
    }
  }

  static getReport() {
    const now = new Date();
    const last5Min = this.writeLog.filter(w => w.timestamp > new Date(now.getTime() - 5 * 60 * 1000));
    const last1Min = this.writeLog.filter(w => w.timestamp > new Date(now.getTime() - 60 * 1000));

    const report = {
      totalWrites: this.writeCount,
      last5Minutes: last5Min.length,
      lastMinute: last1Min.length,
      ratePerMinute: last5Min.length / 5,
      byCollection: this.groupBy(last5Min, 'collection'),
      byOperation: this.groupBy(last5Min, 'operation'),
      topSources: Object.entries(this.groupBy(last5Min, 'stack'))
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 10)
        .map(([source, writes]) => ({
          source: source.substring(0, 100),
          count: writes.length
        }))
    };

    console.group('📊 Reporte de Escrituras Firestore');
    console.log('Total de escrituras desde inicio:', report.totalWrites);
    console.log('Últimos 5 minutos:', report.last5Minutes);
    console.log('Último minuto:', report.lastMinute);
    console.log('Tasa actual:', report.ratePerMinute.toFixed(1), 'escrituras/minuto');
    
    if (report.ratePerMinute > 10) {
      console.warn('🚨 Tasa de escrituras muy alta (>10/min)');
    }
    
    console.log('Por colección:', report.byCollection);
    console.log('Por operación:', report.byOperation);
    console.log('Fuentes más activas:', report.topSources);
    console.groupEnd();

    return report;
  }

  static stopDiagnostic() {
    if (this.originalSetDoc && window.firebase?.firestore) {
      window.firebase.firestore.setDoc = this.originalSetDoc;
    }
    if (this.originalUpdateDoc && window.firebase?.firestore) {
      window.firebase.firestore.updateDoc = this.originalUpdateDoc;
    }
    if (this.originalAddDoc && window.firebase?.firestore) {
      window.firebase.firestore.addDoc = this.originalAddDoc;
    }

    console.log('🛑 Diagnóstico de escrituras detenido');
  }

  static clearLog() {
    this.writeLog = [];
    this.writeCount = 0;
    console.log('🧹 Log de escrituras limpiado');
  }
}

// Hacer disponible globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).FirestoreWriteDiagnostic = FirestoreWriteDiagnostic;
}

export default FirestoreWriteDiagnostic;
