import { Navigate } from 'react-router-dom';
import { paths } from '@/core/routes/paths';

const RelationshipsPage = () => <Navigate to={paths.relationships.index} replace />;

export default RelationshipsPage;
