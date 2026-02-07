import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import HomePage from '@/modules/home/HomePage';

export const homeRoutes: ModuleRouteRegistry = {
  module: 'home',
  defaultRoute: paths.home,
  moduleRoutes: [
    { index: true, element: <HomePage /> }
  ]
};
