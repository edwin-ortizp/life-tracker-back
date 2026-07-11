import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import JournalPage from '@/modules/journal/JournalPage';
import JournalConfigPage from '@/modules/journal/JournalConfigPage';

export const journalRoutes: ModuleRouteRegistry = {
  module: 'journal',
  defaultRoute: paths.journal.view(paths.journal.defaultView),
  moduleRoutes: [
    { path: 'journal', element: <Navigate to={paths.journal.view(paths.journal.defaultView)} replace /> },
    { path: 'journal/view/:viewKey', element: <JournalPage /> },
    { path: 'journal/config', element: <JournalConfigPage /> }
  ]
};
