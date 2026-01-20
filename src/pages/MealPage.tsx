import { Navigate, useParams } from 'react-router-dom';
import { MealPlanner } from '@/features/meal/components';
import PageLayout from '@/components/PageLayout';
import { mealDefaultViewKey, mealViews, type MealViewKey } from '@/features/meal/views';

const MealPage = () => {
  const { viewKey } = useParams<{ viewKey: MealViewKey }>();
  const resolvedViewKey = (viewKey || mealDefaultViewKey) as MealViewKey;

  const isValidView = mealViews.some((view) => view.key === resolvedViewKey);
  if (!isValidView) {
    return <Navigate to={`/meal/view/${mealDefaultViewKey}`} replace />;
  }

  return (
    <PageLayout noPadding className="h-full">
      <MealPlanner selectedDate={new Date()} />
    </PageLayout>
  );
};

export default MealPage;
