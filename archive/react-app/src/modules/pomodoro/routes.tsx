import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import PomodoroPage from '@/modules/pomodoro/PomodoroPage';
import PomodoroConfigPage from '@/modules/pomodoro/PomodoroConfigPage';

export const pomodoroRoutes: ModuleRouteRegistry = {
  module: 'pomodoro',
  defaultRoute: paths.pomodoro.view(paths.pomodoro.defaultView),
  moduleRoutes: [
    { path: 'pomodoro', element: <Navigate to={paths.pomodoro.view(paths.pomodoro.defaultView)} replace /> },
    { path: 'pomodoro/view/:viewKey', element: <PomodoroPage /> },
    { path: 'pomodoro/config', element: <PomodoroConfigPage /> }
  ]
};
