import { MealPlanner } from '@/features/meal/components';
import PageLayout from '@/components/PageLayout';

const MealPage = () => {
  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planificador de Comidas</h1>
        <p className="text-gray-500">Organiza y sigue tus comidas diarias</p>
      </div>
      <MealPlanner />
    </PageLayout>
  );
};

export default MealPage;