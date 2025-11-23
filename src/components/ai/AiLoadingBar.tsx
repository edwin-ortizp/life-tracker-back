// src/components/ai/AiLoadingBar.tsx
import React from 'react';
import { Bot } from 'lucide-react';

interface AiLoadingBarProps {
  message?: string;
}

/**
 * Componente reutilizable para mostrar estado de carga en operaciones de IA
 */
export const AiLoadingBar: React.FC<AiLoadingBarProps> = ({
  message = 'Procesando con IA...'
}) => {
  return (
    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
      <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
      <p className="text-sm text-blue-600">{message}</p>
    </div>
  );
};

export default AiLoadingBar;
