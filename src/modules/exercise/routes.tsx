import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import ExercisePage from '@/modules/exercise/ExercisePage';
import ExerciseConfigPage from '@/modules/exercise/ExerciseConfigPage';

export const exerciseRoutes: ModuleRouteRegistry = {
  module: 'exercise',
  defaultRoute: paths.exercise.view(paths.exercise.defaultView),
  moduleRoutes: [
    { path: 'exercise', element: <Navigate to={paths.exercise.view(paths.exercise.defaultView)} replace /> },
    { path: 'exercise/view/:viewKey', element: <ExercisePage /> },
    { path: 'exercise/config', element: <ExerciseConfigPage /> }
  ]
};
