import { Navigate, useParams } from 'react-router-dom';
import PreparedMeals from '@/modules/prepared-meals/components';
import PageLayout from '@/shared/components/PageLayout';
import { preparedMealsDefaultViewKey, preparedMealsViews, type PreparedMealsViewKey } from '@/modules/prepared-meals/views';

const PreparedMealsPage = () => {
  const { viewKey } = useParams<{ viewKey: PreparedMealsViewKey }>();
  const resolvedViewKey = (viewKey || preparedMealsDefaultViewKey) as PreparedMealsViewKey;

  const isValidView = preparedMealsViews.some((view) => view.key === resolvedViewKey);
  if (!isValidView) {
    return <Navigate to={`/prepared-meals/view/${preparedMealsDefaultViewKey}`} replace />;
  }

  return (
    <PageLayout noPadding className="h-full">
      <PreparedMeals />
    </PageLayout>
  );
};

export default PreparedMealsPage;
