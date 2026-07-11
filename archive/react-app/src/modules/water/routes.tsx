import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import WaterPage from '@/modules/water/WaterPage';
import WaterConfigPage from '@/modules/water/WaterConfigPage';

export const waterRoutes: ModuleRouteRegistry = {
  module: 'water',
  defaultRoute: paths.water.view(paths.water.defaultView),
  moduleRoutes: [
    { path: 'water', element: <Navigate to={paths.water.view(paths.water.defaultView)} replace /> },
    { path: 'water/view/:viewKey', element: <WaterPage /> },
    { path: 'water/config', element: <WaterConfigPage /> }
  ]
};
