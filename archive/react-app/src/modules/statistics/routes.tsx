import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import StatisticsPage from '@/modules/statistics/StatisticsPage';

export const statisticsRoutes: ModuleRouteRegistry = {
  module: 'statistics',
  defaultRoute: paths.stats.home,
  moduleRoutes: [
    { path: 'stats', element: <StatisticsPage /> }
  ]
};
