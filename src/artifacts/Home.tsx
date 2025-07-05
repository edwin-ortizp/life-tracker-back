import { useState } from 'react';
import Auth from '../components/Auth';
import DateSelector from '../components/DateSelector';
import PageLayout from '@/components/PageLayout';
import { useFirestoreErrorHandler } from '@/hooks/useFirestoreErrorHandler';
import { 
  QuickAccessWater, 
  QuickAccessMood, 
  QuickAccessHabits, 
  QuickAccessTasks, 
  QuickAccessPomodoro,
  QuickAccessExercise,
  QuickAccessJournal,
  QuickAccessEnergy,
  DaySummary,
  DailyScore,
  DailyHabitsChecklist,
  DailyInsightWidget
} from '@/components/widgets';

const DailyTrackerApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Inicializar el manejador global de errores de Firestore
  useFirestoreErrorHandler();

  return (
    <PageLayout>
      <DateSelector 
        selectedDate={selectedDate} 
        onChange={setSelectedDate} 
      />

      {/* Daily Score Prominently Displayed */}
      <div className="mb-8">
        <DailyScore date={selectedDate} variant="detailed" />
      </div>

      {/* Daily AI Insight */}
      <div className="mb-8">
        <DailyInsightWidget date={selectedDate} variant="detailed" />
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
        {/* Quick Access Widgets - Row 1 */}
        <QuickAccessWater date={selectedDate} variant="compact" />
        <QuickAccessMood date={selectedDate} variant="compact" />
        <QuickAccessHabits date={selectedDate} variant="compact" />
        <QuickAccessTasks date={selectedDate} variant="compact" />
        
        {/* Quick Access Widgets - Row 2 */}
        <QuickAccessPomodoro date={selectedDate} variant="compact" />
        <QuickAccessExercise date={selectedDate} variant="compact" />
        <QuickAccessJournal date={selectedDate} variant="compact" />
        <QuickAccessEnergy date={selectedDate} variant="compact" />
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <DaySummary date={selectedDate} variant="detailed" />
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