import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import MoodPage from '@/modules/mood/MoodPage';
import MoodConfigPage from '@/modules/mood/MoodConfigPage';

export const moodRoutes: ModuleRouteRegistry = {
  module: 'mood',
  defaultRoute: paths.mood.view(paths.mood.defaultView),
  moduleRoutes: [
    { path: 'mood', element: <Navigate to={paths.mood.view(paths.mood.defaultView)} replace /> },
    { path: 'mood/view/:viewKey', element: <MoodPage /> },
    { path: 'mood/config', element: <MoodConfigPage /> }
  ]
};
