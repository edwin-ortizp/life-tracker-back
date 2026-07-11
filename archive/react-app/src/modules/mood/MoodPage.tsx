// src/pages/MoodPage.tsx
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from "@/shared/components/ui/card";
import { Mood } from '@/modules/mood/components';
import DateSelector from '@/shared/components/DateSelector';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/shared/components/module-views/types';
import { moodDefaultViewKey, moodViews, type MoodViewKey } from '@/modules/mood/views';
import { Heart, Settings } from 'lucide-react';
import { paths } from '@/core/routes/paths';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#FF0000'];

type MoodViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  moodDistribution: any[];
};

const MoodTrackerView: React.FC<MoodViewProps> = ({ selectedDate, onDateChange }) => (
  <div className="space-y-4">
    <DateSelector selectedDate={selectedDate} onChange={onDateChange} />
    <Mood selectedDate={selectedDate} />
  </div>
);

const MoodAnalyticsView: React.FC<MoodViewProps> = ({ moodDistribution }) => (
  <div className="grid md:grid-cols-2 gap-4">
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-medium mb-4">Distribucion de Estados de Animo</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={moodDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({
                  cx = 0,
                  cy = 0,
                  midAngle = 0,
                  innerRadius = 0,
                  outerRadius = 0,
                  value = 0,
                  index = 0
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = 25 + innerRadius + (outerRadius - innerRadius);
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#888"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      {`${moodDistribution[index].name} (${value})`}
                    </text>
                  );
                }}
              >
                {moodDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <h3 className="font-medium mb-4">Patrones y Tendencias</h3>
      </CardContent>
    </Card>
  </div>
);

const MoodPage = () => {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: MoodViewKey }>();
  const resolvedViewKey = (viewKey || moodDefaultViewKey) as MoodViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [moodDistribution] = useState<any[]>([]);

  const moodViewRegistry: Array<ModuleViewDefinition<MoodViewProps>> = moodViews.map((view) => ({
    ...view,
    component: view.key === 'tracker' ? MoodTrackerView : MoodAnalyticsView
  }));

  const activeView = moodViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={paths.mood.view(moodDefaultViewKey)} replace />;
  }

  const actions: ModuleViewAction[] = [
    {
      id: 'config',
      label: 'Configuracion',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate(paths.mood.config),
      tooltip: 'Configuracion'
    }
  ];

  const ActiveView = activeView.component;

  return (
    <ModuleViewLayout
      title="Estado de Animo"
      subtitle="Registra y analiza tu estado emocional para mejorar tu bienestar"
      icon={<Heart className="h-4 w-4 text-white" />}
      views={moodViewRegistry}
      activeViewKey={resolvedViewKey}
      onViewChange={(key) => navigate(paths.mood.view(key))}
      actions={actions}
    >
      <div className="p-4 space-y-4">
        <ActiveView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          moodDistribution={moodDistribution}
        />
      </div>
    </ModuleViewLayout>
  );
};

export default MoodPage;
