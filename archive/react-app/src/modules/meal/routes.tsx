import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import MealPage from '@/modules/meal/MealPage';
import MealConfigPage from '@/modules/meal/MealConfigPage';

export const mealRoutes: ModuleRouteRegistry = {
  module: 'meal',
  defaultRoute: paths.meal.view(paths.meal.defaultView),
  moduleRoutes: [
    { path: 'meal', element: <Navigate to={paths.meal.view(paths.meal.defaultView)} replace /> },
    { path: 'meal/view/:viewKey', element: <MealPage /> },
    { path: 'meal/config', element: <MealConfigPage /> }
  ]
};
