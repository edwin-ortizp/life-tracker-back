import { Navigate } from 'react-router-dom';
import type { ModuleRouteRegistry } from '@/core/routes/types';
import { paths } from '@/core/routes/paths';
import RelationshipsIndexPage from '@/modules/relationships/RelationshipsIndexPage';
import RelationshipDetailPage from '@/modules/relationships/RelationshipDetailPage';

export const relationshipsRoutes: ModuleRouteRegistry = {
  module: 'relationships',
  defaultRoute: paths.relationships.index,
  moduleRoutes: [
    { path: 'relationships', element: <RelationshipsIndexPage /> },
    { path: 'relationships/:relationshipId', element: <RelationshipDetailPage /> }
  ],
  legacyRedirects: [
    { path: 'relationships/view/:viewKey', element: <Navigate to={paths.relationships.index} replace /> }
  ]
};
