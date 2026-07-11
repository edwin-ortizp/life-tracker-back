import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import GoalsPage from '@/modules/goals/GoalsPage';

export const goalsRoutes: ModuleRouteRegistry = {
  module: 'goals',
  defaultRoute: paths.goals.base,
  moduleRoutes: [
    { path: 'goals', element: <GoalsPage /> },
    { path: 'goals/:goalId', element: <GoalsPage /> }
  ]
};
