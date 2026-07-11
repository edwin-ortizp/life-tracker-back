import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import PreparedMealsPage from '@/modules/prepared-meals/PreparedMealsPage';
import PreparedMealsConfigPage from '@/modules/prepared-meals/PreparedMealsConfigPage';

export const preparedMealsRoutes: ModuleRouteRegistry = {
  module: 'prepared-meals',
  defaultRoute: paths.preparedMeals.view(paths.preparedMeals.defaultView),
  moduleRoutes: [
    { path: 'prepared-meals', element: <Navigate to={paths.preparedMeals.view(paths.preparedMeals.defaultView)} replace /> },
    { path: 'prepared-meals/view/:viewKey', element: <PreparedMealsPage /> },
    { path: 'prepared-meals/config', element: <PreparedMealsConfigPage /> }
  ]
};
