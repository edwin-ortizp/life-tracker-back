import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import ShoppingListPage from '@/modules/shopping-list/ShoppingListPage';
import ShoppingListConfigPage from '@/modules/shopping-list/ShoppingListConfigPage';

export const shoppingListRoutes: ModuleRouteRegistry = {
  module: 'shopping-list',
  defaultRoute: paths.shoppingList.view(paths.shoppingList.defaultView),
  moduleRoutes: [
    { path: 'shopping-list', element: <Navigate to={paths.shoppingList.view(paths.shoppingList.defaultView)} replace /> },
    { path: 'shopping-list/view/:viewKey', element: <ShoppingListPage /> },
    { path: 'shopping-list/config', element: <ShoppingListConfigPage /> }
  ],
  legacyRedirects: [
    { path: 'shopping-list/list', element: <Navigate to={paths.shoppingList.view('list')} replace /> },
    { path: 'shopping-list/kanban', element: <Navigate to={paths.shoppingList.view('kanban')} replace /> }
  ]
};
