import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import NegativeHabitsPage from '@/modules/negative-habits/NegativeHabitsPage';
import NegativeHabitsConfigPage from '@/modules/negative-habits/NegativeHabitsConfigPage';

export const negativeHabitRoutes: ModuleRouteRegistry = {
  module: 'negative-habits',
  defaultRoute: paths.negativeHabits.view(paths.negativeHabits.defaultView),
  moduleRoutes: [
    { path: 'negative', element: <Navigate to={paths.negativeHabits.view(paths.negativeHabits.defaultView)} replace /> },
    { path: 'negative/view/:viewKey', element: <NegativeHabitsPage /> },
    { path: 'negative/config', element: <NegativeHabitsConfigPage /> }
  ]
};
