import RecipeDetail from '@/features/recipe/components/RecipeDetail';
import PageLayout from '@/components/PageLayout';

const RecipeDetailPage = () => {
  return (
    <PageLayout noPadding className="h-full">
      <RecipeDetail />
    </PageLayout>
  );
};

export default RecipeDetailPage;
