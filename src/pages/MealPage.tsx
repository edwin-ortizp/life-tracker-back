import { MealPlanner } from '@/features/meal/components';
import PageLayout from '@/components/PageLayout';

const MealPage = () => {
  return (
    <PageLayout noPadding className="h-full">
      <MealPlanner selectedDate={new Date()} />
    </PageLayout>
  );
};

export default MealPage;