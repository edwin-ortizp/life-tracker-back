import React from 'react';
import { Badge } from '@/components/ui/badge';

const PRIORITY_INFO: Record<string, { color: string; text: string }> = {
  do: { color: 'bg-red-500', text: 'Hacer (urgente + importante)' },
  decide: { color: 'bg-orange-500', text: 'Decidir (importante)' },
  delegate: { color: 'bg-blue-500', text: 'Delegar (urgente)' },
  delete: { color: 'bg-gray-400', text: 'Eliminar (sin prioridad)' }
};

export const PriorityLegend: React.FC = () => (
  <div className="mt-6 text-sm">
    <h2 className="font-medium mb-2">Convenciones de prioridad</h2>
    <ul className="space-y-1">
      {Object.entries(PRIORITY_INFO).map(([key, info]) => (
        <li key={key} className="flex items-center gap-2">
          <Badge className={`text-xs font-normal px-2 py-0.5 text-white ${info.color}`}>{key}</Badge>
          <span>{info.text}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default PriorityLegend;
