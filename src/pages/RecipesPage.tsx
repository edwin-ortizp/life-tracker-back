import { Navigate, useParams } from 'react-router-dom';
import Recipes from '@/features/recipe/components';
import PageLayout from '@/components/PageLayout';
import { recipeDefaultViewKey, recipeViews, type RecipeViewKey } from '@/features/recipe/views';

const RecipesPage = () => {
  const { viewKey } = useParams<{ viewKey: RecipeViewKey }>();
  const resolvedViewKey = (viewKey || recipeDefaultViewKey) as RecipeViewKey;

  const isValidView = recipeViews.some((view) => view.key === resolvedViewKey);
  if (!isValidView) {
    return <Navigate to={`/recipes/view/${recipeDefaultViewKey}`} replace />;
  }

  return (
    <PageLayout noPadding className="h-full">
      <Recipes />
    </PageLayout>
  );
};

export default RecipesPage;
