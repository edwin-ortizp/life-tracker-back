import { Navigate, useParams } from 'react-router-dom';
import Recipes from '@/modules/recipe/components';
import PageLayout from '@/shared/components/PageLayout';
import { recipeDefaultViewKey, recipeViews, type RecipeViewKey } from '@/modules/recipe/views';

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
