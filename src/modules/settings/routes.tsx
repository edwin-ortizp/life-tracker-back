import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import SettingsPage from '@/modules/settings/SettingsPage';

export const settingsRoutes: ModuleRouteRegistry = {
  module: 'settings',
  defaultRoute: paths.settings,
  moduleRoutes: [
    { path: 'settings', element: <SettingsPage /> }
  ]
};
