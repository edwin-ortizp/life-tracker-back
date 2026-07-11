import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import HabitPage from '@/modules/habit/HabitPage';
import HabitConfigPage from '@/modules/habit/HabitConfigPage';

export const habitRoutes: ModuleRouteRegistry = {
  module: 'habit',
  defaultRoute: paths.habit.view(paths.habit.defaultView),
  moduleRoutes: [
    { path: 'habit', element: <Navigate to={paths.habit.view(paths.habit.defaultView)} replace /> },
    { path: 'habit/view/:viewKey', element: <HabitPage /> },
    { path: 'habit/config', element: <HabitConfigPage /> }
  ]
};
