import { Navigate, useParams } from 'react-router-dom';
import ShoppingList from '@/modules/shopping-list/components';
import PageLayout from '@/shared/components/PageLayout';
import { shoppingListDefaultViewKey, shoppingListViews, type ShoppingListViewKey } from '@/modules/shopping-list/views';

const ShoppingListPage = () => {
  const { viewKey } = useParams<{ viewKey: ShoppingListViewKey }>();
  const resolvedViewKey = (viewKey || shoppingListDefaultViewKey) as ShoppingListViewKey;

  const isValidView = shoppingListViews.some((view) => view.key === resolvedViewKey);
  if (!isValidView) {
    return <Navigate to={`/shopping-list/view/${shoppingListDefaultViewKey}`} replace />;
  }

  return (
    <PageLayout noPadding className="h-full">
      <ShoppingList />
    </PageLayout>
  );
};

export default ShoppingListPage;
