// src/pages/JournalPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Journal, LifeCalendar } from '@/modules/journal/components';
import { JournalEntryProvider } from '@/modules/journal/context/JournalEntryContext';
import { JournalLockProvider } from '@/modules/journal/context/JournalLockContext';
import DateSelector from '@/shared/components/DateSelector';
import { useAuth } from '@/shared/hooks/useAuth';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/shared/components/module-views/types';
import { journalDefaultViewKey, journalViews, type JournalViewKey } from '@/modules/journal/views';
import { BookOpen, Settings } from 'lucide-react';
import { addDays } from 'date-fns';
import { useJournalWeekEntries } from '@/modules/journal/controllers/useJournalWeekEntries.supabase';
import { getStartOfIsoWeek } from '@/shared/utils/isoWeek';
import { getLocalDateString } from '@/shared/utils/dates';
import { paths } from '@/core/routes/paths';

type JournalViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

const JournalEntriesView: React.FC<JournalViewProps> = ({ selectedDate, onDateChange }) => {
  const [searchParams] = useSearchParams();
  const weekParam = searchParams.get('week');
  const navigate = useNavigate();

  const weekRange = useMemo(() => {
    if (!weekParam) return null;
    const match = weekParam.match(/^(\d{4})-W(\d{1,2})$/);
    if (!match) return null;
    const isoYear = Number(match[1]);
    const isoWeek = Number(match[2]);
    if (!isoYear || !isoWeek) return null;
    const start = getStartOfIsoWeek(isoYear, isoWeek);
    const end = addDays(start, 6);
    return { start, end };
  }, [weekParam]);

  const { entries } = useJournalWeekEntries(weekRange?.start ?? null, weekRange?.end ?? null);

  const weekDays = useMemo(() => {
    if (!weekRange) return [];
    return Array.from({ length: 7 }, (_, index) => addDays(weekRange.start, index));
  }, [weekRange]);

  useEffect(() => {
    if (weekRange) {
      onDateChange(weekRange.start);
    }
  }, [weekRange, onDateChange]);

  return (
    <JournalEntryProvider>
      <JournalLockProvider>
        <div className="space-y-4">
          {weekRange && (
            <div className="rounded-lg border bg-background/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Semana {weekParam}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(paths.journal.view('life-calendar'))}>
                    Volver al Life Calendar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
                    Ir a hoy
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {weekDays.map((day) => {
                  const key = getLocalDateString(day);
                  const text = entries[key];
                  return (
                    <button
                      key={key}
                      className="text-left rounded-md border border-dashed p-3 hover:bg-muted/30 transition"
                      onClick={() => onDateChange(day)}
                    >
                      <div className="text-xs text-muted-foreground">{key}</div>
                      <div className="text-sm font-medium truncate">
                        {text ? text.slice(0, 80) : 'Sin entrada'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <DateSelector selectedDate={selectedDate} onChange={onDateChange} />
          <div className="mt-4">
            <Journal selectedDate={selectedDate} />
          </div>
        </div>
      </JournalLockProvider>
    </JournalEntryProvider>
  );
};

const JournalLifeCalendarView: React.FC<JournalViewProps> = () => (
  <LifeCalendar />
);

const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: JournalViewKey }>();
  const resolvedViewKey = (viewKey || journalDefaultViewKey) as JournalViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  const journalViewRegistry: Array<ModuleViewDefinition<JournalViewProps>> = journalViews.map((view) => ({
    ...view,
    component: view.key === 'life-calendar' ? JournalLifeCalendarView : JournalEntriesView
  }));

  const activeView = journalViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={paths.journal.view(journalDefaultViewKey)} replace />;
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
      onClick: () => navigate(paths.journal.config),
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
      onViewChange={(key) => navigate(paths.journal.view(key))}
      actions={actions}
    >
      <div className="p-4 space-y-4">
        <ActiveView selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>
    </ModuleViewLayout>
  );
};

export default JournalPage;
