import React from 'react';
import { Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { useDailyInsight } from '@/hooks/useDailyInsight';
import { cn } from '@/lib/utils';

interface DailyInsightWidgetProps {
  date: Date;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export const DailyInsightWidget: React.FC<DailyInsightWidgetProps> = ({
  date,
  variant = 'detailed',
  className
}) => {
  const { insight, loading, error, regenerateInsight } = useDailyInsight(date);

  const handleRefresh = async () => {
    await regenerateInsight();
  };

  return (
    <DailyWidget
      title="💡 Insight del Día"
      icon={Lightbulb}
      variant={variant}
      loading={loading}
      className={className}
    >
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generando insight personalizado...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm font-medium">Error al generar insight</span>
            </div>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-sm text-red-700 hover:text-red-800 underline"
            >
              Intentar nuevamente
            </button>
          </div>
        ) : insight ? (
          <div className="space-y-3">
            {/* Insight Principal */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p 
                    className="text-sm text-blue-900 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: insight.content }}
                  />
                </div>
              </div>
            </div>

            {/* Metadatos */}
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>Basado en tus últimos 7 días</span>
              <div className="flex items-center gap-2">
                <span>
                  Generado: {new Date(insight.generatedAt).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title="Regenerar insight"
                >
                  <RefreshCw className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>

            {/* Acción rápida si está disponible */}
            {insight.quickAction && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  className={cn(
                    "w-full p-2 text-sm font-medium rounded-md transition-colors",
                    "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                  )}
                  onClick={() => {
                    // Aquí podríamos implementar acciones rápidas
                    // Por ejemplo, navegar a una página específica o ejecutar una acción
                    console.log('Quick action:', insight.quickAction);
                  }}
                >
                  {insight.quickAction}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm font-medium">Sin insight disponible</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              No hay suficientes datos para generar un insight personalizado.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Generar insight
            </button>
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default DailyInsightWidget;