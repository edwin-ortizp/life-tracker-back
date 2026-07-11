import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import TaskPage from '@/modules/task/TaskPage';
import TaskConfigPage from '@/modules/task/TaskConfigPage';
import TaskRunPage from '@/modules/task/TaskRunPage';

export const taskRoutes: ModuleRouteRegistry = {
  module: 'task',
  defaultRoute: paths.task.view(paths.task.defaultView),
  moduleRoutes: [
    { path: 'task', element: <Navigate to={paths.task.view(paths.task.defaultView)} replace /> },
    { path: 'task/view/:viewKey', element: <TaskPage /> },
    { path: 'task/config', element: <TaskConfigPage /> },
    { path: 'task/:taskId/run', element: <TaskRunPage /> }
  ],
  legacyRedirects: [
    { path: 'task/list', element: <Navigate to={paths.task.view('list')} replace /> },
    { path: 'task/kanban', element: <Navigate to={paths.task.view('kanban')} replace /> },
    { path: 'task/calendar', element: <Navigate to={paths.task.view('calendar')} replace /> },
    { path: 'tasks/calendar', element: <Navigate to={paths.task.view('calendar')} replace /> },
    { path: 'kanban', element: <Navigate to={paths.task.view('kanban')} replace /> }
  ]
};
