// src/pages/JournalPage.tsx
import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Journal } from '@/features/journal/components';
import DateSelector from '@/components/DateSelector';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import ModuleViewLayout from '@/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/components/module-views/types';
import { journalDefaultViewKey, journalViews, type JournalViewKey } from '@/features/journal/views';
import { BookOpen, Settings } from 'lucide-react';

type JournalViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

const JournalEntriesView: React.FC<JournalViewProps> = ({ selectedDate, onDateChange }) => (
  <div className="space-y-4">
    <DateSelector selectedDate={selectedDate} onChange={onDateChange} />
    <div className="mt-4">
      <Journal selectedDate={selectedDate} />
    </div>
  </div>
);

const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: JournalViewKey }>();
  const resolvedViewKey = (viewKey || journalDefaultViewKey) as JournalViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  const journalViewRegistry: Array<ModuleViewDefinition<JournalViewProps>> = journalViews.map((view) => ({
    ...view,
    component: JournalEntriesView
  }));

  const activeView = journalViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={`/journal/view/${journalDefaultViewKey}`} replace />;
  }

  if (!user) {
    return (
      <ModuleViewLayout
        title="Diario Personal"
        icon={<BookOpen className="h-4 w-4 text-white" />}
      >
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold">Inicia sesion para acceder a tu diario</h2>
            </CardContent>
          </Card>
        </div>
      </ModuleViewLayout>
    );
  }

  const actions: ModuleViewAction[] = [
    {
      id: 'config',
      label: 'Configuracion',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate('/journal/config'),
      tooltip: 'Configuracion'
    }
  ];

  const ActiveView = activeView.component;

  return (
    <ModuleViewLayout
      title="Diario Personal"
      subtitle="Registra tus pensamientos y reflexiones diarias"
      icon={<BookOpen className="h-4 w-4 text-white" />}
      views={journalViewRegistry}
      activeViewKey={resolvedViewKey}
      onViewChange={(key) => navigate(`/journal/view/${key}`)}
      actions={actions}
    >
      <div className="p-4 space-y-4">
        <ActiveView selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>
    </ModuleViewLayout>
  );
};

export default JournalPage;
