// src/modules/task/components/TaskRecurrenceConfig.tsx
import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useRecurrenceLogic } from '../controllers/useRecurrenceLogic';
import type { RecurrenceConfig } from '../controllers/useRecurrenceLogic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

interface TaskRecurrenceConfigProps {
  isRecurrent: boolean;
  onRecurrentChange: (isRecurrent: boolean) => void;
  config?: RecurrenceConfig;
  onConfigChange: (config: RecurrenceConfig) => void;
}

export const TaskRecurrenceConfig: React.FC<TaskRecurrenceConfigProps> = ({
  isRecurrent,
  onRecurrentChange,
  config,
  onConfigChange
}) => {
  const { getRecurrenceText } = useRecurrenceLogic({
    initialConfig: config
  });

  const handlePatternChange = (pattern: RecurrenceConfig['pattern']) => {
    const newConfig = {
      ...(config || {}),
      frequency: 1,
      pattern,
      ...(pattern === 'custom' && { customDays: config?.customDays || 1 })
    };
    onConfigChange(newConfig);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRecurrent"
          checked={isRecurrent}
          onCheckedChange={(checked) => {
            const isChecked = checked as boolean;
            onRecurrentChange(isChecked);
          }}
        />
        <label
          htmlFor="isRecurrent"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Tarea recurrente
        </label>
      </div>

      {isRecurrent && config && (
        <div className="pl-6 space-y-4">
          <Select
            value={config.pattern}
            onValueChange={(value) => handlePatternChange(value as RecurrenceConfig['pattern'])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona frecuencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diariamente</SelectItem>
              <SelectItem value="weekly">Semanalmente</SelectItem>
              <SelectItem value="monthly">Mensualmente</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {config.pattern === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={config.customDays}
                onChange={(e) => {
                  const days = parseInt(e.target.value);
                  if (days > 0) {
                    onConfigChange({
                      ...config,
                      customDays: days
                    });
                  }
                }}
                className="w-24"
              />
              <span className="text-sm text-gray-500">días</span>
            </div>
          )}

          {config && (
            <div className="text-sm text-blue-600">
              {getRecurrenceText(new Date(), config)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};