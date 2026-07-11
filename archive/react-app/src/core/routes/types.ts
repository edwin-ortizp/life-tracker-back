import type { RouteObject } from 'react-router-dom';

export interface ModuleRouteRegistry {
  module: string;
  defaultRoute: string;
  moduleRoutes: RouteObject[];
  legacyRedirects?: RouteObject[];
}
