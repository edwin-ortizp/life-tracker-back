import { useState } from 'react';
import { Pomodoro } from '@/features/pomodoro/components';
import { Water } from '@/features/water/components';
import { Habit } from '@/features/habit/components';
import { Mood } from '@/features/mood/components';
import { Journal } from '@/features/journal/components';
import { Task } from '@/features/task/components';
import Auth from '../components/Auth';
import DateSelector from '../components/DateSelector';
import PageLayout from '@/components/PageLayout';
import { ModernCard } from '@/components/ui/modern-card';
import { useModuleSettings } from '@/hooks/useModuleSettings';

const DailyTrackerApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { settings } = useModuleSettings('water', { dailyGoal: 2000 });

  return (
    <PageLayout>
      {/* Header con gradiente */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Daily Life Tracker
        </h1>
        <p className="text-muted-foreground text-lg">
          Organiza tu día, mejora tu vida
        </p>
      </div>

      <DateSelector 
        selectedDate={selectedDate} 
        onChange={setSelectedDate} 
      />

      <div className="grid grid-cols-12 gap-6">        {/* Sección principal */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernCard variant="elevated" className="bg-card">
              <Pomodoro selectedDate={selectedDate} />
            </ModernCard>
            <ModernCard variant="elevated" className="bg-card">
              <Water selectedDate={selectedDate} goal={settings.dailyGoal} />
            </ModernCard>
          </div>
        </div>
          {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <ModernCard variant="glass">
            <Mood selectedDate={selectedDate} />
          </ModernCard>
        </div>
        
        {/* Journal section */}
        <div className="col-span-12 space-y-8">
          <ModernCard variant="elevated" className="bg-card">
            <Journal selectedDate={selectedDate} />
          </ModernCard>
        </div>
        
        {/* Bottom section */}
        <div className="col-span-12 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernCard variant="elevated" className="bg-card">
              <Habit selectedDate={selectedDate} />
            </ModernCard>
            <ModernCard variant="elevated" className="bg-card">
              <Task selectedDate={selectedDate} />
            </ModernCard>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Auth />
      </div>
    </PageLayout>
  );
};

export default DailyTrackerApp;