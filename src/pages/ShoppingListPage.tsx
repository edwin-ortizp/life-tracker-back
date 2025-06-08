import ShoppingList from '@/features/shopping-list/components';
import PageLayout from '@/components/PageLayout';

const ShoppingListPage = () => (
  <PageLayout noPadding className="h-full">
    <ShoppingList />
  </PageLayout>
);

export default ShoppingListPage;
