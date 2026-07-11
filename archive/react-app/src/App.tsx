import { useRoutes } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAppRoutes } from '@/core/routes/app-routes';

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const { user, loading } = useAuth();
  const routing = useRoutes(getAppRoutes(Boolean(user)));

  // Show loading spinner while checking authentication
  if (loading) {
    return <PageLoader />;
  }

  return routing;
}
export default App;
