import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Timer } from 'lucide-react';
import { pomodoroViews } from '@/modules/pomodoro/views';
import { useModuleSettings } from '@/shared/hooks/useModuleSettings';
import { useState } from 'react';

const PomodoroConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const defaults = { dailyWorkMinutesGoal: 300 };
  const { settings, saveSettings, status, error } = useModuleSettings('pomodoro', defaults);
  const [goalInput, setGoalInput] = useState<number | null>(null);

  return (
    <ModuleViewLayout
      title="Configuracion de Pomodoro"
      icon={<Timer className="h-4 w-4 text-white" />}
      views={pomodoroViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/pomodoro/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Objetivo diario de trabajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dailyWorkMinutesGoal">Minutos diarios objetivo</Label>
              <Input
                id="dailyWorkMinutesGoal"
                type="number"
                value={goalInput ?? settings.dailyWorkMinutesGoal}
                onChange={(e) => setGoalInput(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => saveSettings({ dailyWorkMinutesGoal: goalInput ?? settings.dailyWorkMinutesGoal })}
              >
                Guardar
              </Button>
              {status === 'saving' && (
                <span className="text-xs text-gray-500">Guardando...</span>
              )}
              {status === 'saved' && (
                <span className="text-xs text-green-600">Guardado</span>
              )}
              {error && (
                <span className="text-xs text-red-600">{error}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default PomodoroConfigPage;
