import { Navigate, useParams } from 'react-router-dom';
import { MealPlanner } from '@/modules/meal/components';
import PageLayout from '@/shared/components/PageLayout';
import { mealDefaultViewKey, mealViews, type MealViewKey } from '@/modules/meal/views';

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
