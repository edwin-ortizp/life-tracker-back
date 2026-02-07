import React from 'react';
import { Battery, Plus } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEnergyData } from '@/modules/mood/controllers/useEnergyData.supabase';
import {
  BatteryWarning,
  BatteryLow,
  BatteryMedium,
  BatteryFull
} from 'lucide-react';

interface QuickAccessEnergyProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessEnergy: React.FC<QuickAccessEnergyProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { energyHistory, status } = useEnergyData(date);
  const loading = status === 'saving' || status === 'pending';

  const entries = energyHistory || [];
  const entryCount = entries.length;
  const averageEnergy = entries.length > 0 
    ? entries.reduce((sum: number, entry: { level: number }) => sum + entry.level, 0) / entries.length 
    : 0;
  const lastEntry = entries[entries.length - 1];

  const getBatteryIcon = (level: number) => {
    if (level >= 4.5) return BatteryFull;
    if (level >= 3.5) return Battery;
    if (level >= 2.5) return BatteryMedium;
    if (level >= 1.5) return BatteryLow;
    return BatteryWarning;
  };

  const getBatteryColor = (level: number) => {
    if (level >= 4.5) return 'text-green-600';
    if (level >= 3.5) return 'text-lime-500';
    if (level >= 2.5) return 'text-yellow-500';
    if (level >= 1.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const BatteryIcon = getBatteryIcon(averageEnergy);

  return (
    <DailyWidget
      title="Nivel de Energía"
      icon={Battery}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/mood/view/tracker')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            {entryCount > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <BatteryIcon className={`w-6 h-6 ${getBatteryColor(averageEnergy)}`} />
                  <div>
                    <p className="text-sm font-medium">
                      {averageEnergy.toFixed(1)}/5
                    </p>
                    <p className="text-xs text-gray-500">
                      {entryCount} registro{entryCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <BatteryMedium className="w-6 h-6 text-gray-400" />
                <p className="text-sm text-gray-500">Sin registros</p>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/mood/view/tracker');
            }}
            className="flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {variant === 'detailed' && 'Registrar'}
          </Button>
        </div>
        
        {variant === 'detailed' && lastEntry && (
          <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
            <p className="font-medium">Último registro:</p>
            <p>
              Nivel {lastEntry.level}/5 - {lastEntry.time}
              {lastEntry.comment && ` - "${lastEntry.comment}"`}
            </p>
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessEnergy;
