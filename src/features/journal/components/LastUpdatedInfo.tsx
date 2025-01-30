import React from 'react';
import { Clock } from 'lucide-react';

interface LastUpdatedInfoProps {
  lastUpdated?: string;
  className?: string;
}

export const LastUpdatedInfo: React.FC<LastUpdatedInfoProps> = ({
  lastUpdated,
  className = ''
}) => {
  if (!lastUpdated) return null;

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
      <Clock className="w-4 h-4" />
      <span>Última actualización: {lastUpdated}</span>
    </div>
  );
};