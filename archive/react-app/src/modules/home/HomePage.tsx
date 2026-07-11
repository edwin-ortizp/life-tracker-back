import Auth from '@/shared/components/Auth';
import DateSelector from '@/shared/components/DateSelector';
import PageLayout from '@/shared/components/PageLayout';
import {
  QuickAccessWater,
  QuickAccessMood,
  QuickAccessHabits,
  QuickAccessTasks,
  QuickAccessEnergy,
  DailyHabitsChecklist,
} from '@/shared/components/widgets';
import { useHomeController } from '@/modules/home/controllers/useHomeController';

const HomePage = () => {
  const { selectedDate, setSelectedDate } = useHomeController();

  return (
    <PageLayout>
      <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

      <div className="mb-8" />
      <div className="mb-8" />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
        <QuickAccessWater date={selectedDate} variant="compact" />
        <QuickAccessMood date={selectedDate} variant="compact" />
        <QuickAccessHabits date={selectedDate} variant="compact" />
        <QuickAccessTasks date={selectedDate} variant="compact" />
        <QuickAccessEnergy date={selectedDate} variant="compact" />
      </div>

      <div className="mb-8" />

      <div className="mb-8">
        <DailyHabitsChecklist date={selectedDate} />
      </div>

      <div className="mt-6">
        <Auth />
      </div>
    </PageLayout>
  );
};

export default HomePage;
