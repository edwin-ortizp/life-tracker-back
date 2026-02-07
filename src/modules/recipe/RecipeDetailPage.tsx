import RecipeDetail from '@/modules/recipe/components/RecipeDetail';
import PageLayout from '@/shared/components/PageLayout';

const RecipeDetailPage = () => {
  return (
    <PageLayout noPadding className="h-full">
      <RecipeDetail />
    </PageLayout>
  );
};

export default RecipeDetailPage;
