import { useState } from 'react';
import Auth from '../shared/components/Auth';
import DateSelector from '../shared/components/DateSelector';
import PageLayout from '@/shared/components/PageLayout';
import { 
  QuickAccessWater, 
  QuickAccessMood, 
  QuickAccessHabits, 
  QuickAccessTasks, 
  QuickAccessEnergy,
  DailyHabitsChecklist,
} from '@/shared/components/widgets';

const DailyTrackerApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Inicializar el manejador global de errores de Firestore

  return (
    <PageLayout>
      <DateSelector 
        selectedDate={selectedDate} 
        onChange={setSelectedDate} 
      />

      {/* Daily Score Prominently Displayed */}
      <div className="mb-8">
      </div>

      {/* Daily AI Insight */}
      <div className="mb-8">
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
        {/* Quick Access Widgets - Row 1 */}
        <QuickAccessWater date={selectedDate} variant="compact" />
        <QuickAccessMood date={selectedDate} variant="compact" />
        <QuickAccessHabits date={selectedDate} variant="compact" />
        <QuickAccessTasks date={selectedDate} variant="compact" />
        
        {/* Quick Access Widgets - Row 2 */}
        <QuickAccessEnergy date={selectedDate} variant="compact" />
      </div>

      {/* Summary Section */}
      <div className="mb-8">
      </div>

      {/* Habits Checklist */}
      <div className="mb-8">
        <DailyHabitsChecklist date={selectedDate} />
      </div>
      
      <div className="mt-6">
        <Auth />
      </div>
    </PageLayout>
  );
};

export default DailyTrackerApp;