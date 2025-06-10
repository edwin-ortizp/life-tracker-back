import Recipes from '@/features/recipe/components';
import PageLayout from '@/components/PageLayout';

const RecipesPage = () => (
  <PageLayout noPadding className="h-full">
    <Recipes />
  </PageLayout>
);

export default RecipesPage;
