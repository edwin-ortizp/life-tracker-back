import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AppLayout from './layouts/AppLayout';

// Lazy loading de todas las páginas
const Home = lazy(() => import('./artifacts/Home'));
const WaterPage = lazy(() => import('./pages/WaterPage'));
const PomodoroPage = lazy(() => import('./pages/PomodoroPage'));
const MoodPage = lazy(() => import('./pages/MoodPage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const TaskPage = lazy(() => import('./pages/TaskPage'));
const KanbanPage = lazy(() => import('./pages/KanbanPage'));
const HabitPage = lazy(() => import('./pages/HabitPage'));
const MealPage = lazy(() => import('./pages/MealPage'));
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const PreparedMealsPage = lazy(() => import('./pages/PreparedMealsPage'));
const ExercisePage = lazy(() => import('./pages/ExercisePage'));
const NegativeHabitsPage = lazy(() => import('./pages/NegativeHabitsPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);


function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        } />
        <Route path="habit" element={
          <Suspense fallback={<PageLoader />}>
            <HabitPage />
          </Suspense>
        } />
        <Route path="task" element={
          <Suspense fallback={<PageLoader />}>
            <TaskPage />
          </Suspense>
        } />
        <Route path="kanban" element={
          <Suspense fallback={<PageLoader />}>
            <KanbanPage />
          </Suspense>
        } />
        <Route path="journal" element={
          <Suspense fallback={<PageLoader />}>
            <JournalPage />
          </Suspense>
        } />
        <Route path="mood" element={
          <Suspense fallback={<PageLoader />}>
            <MoodPage />
          </Suspense>
        } />
        <Route path="water" element={
          <Suspense fallback={<PageLoader />}>
            <WaterPage />
          </Suspense>
        } />
        <Route path="pomodoro" element={
          <Suspense fallback={<PageLoader />}>
            <PomodoroPage />
          </Suspense>
        } />
        <Route path="exercise" element={
          <Suspense fallback={<PageLoader />}>
            <ExercisePage />
          </Suspense>
        } />
        <Route path="negative" element={
          <Suspense fallback={<PageLoader />}>
            <NegativeHabitsPage />
          </Suspense>
        } />
        <Route path="stats" element={
          <Suspense fallback={<PageLoader />}>
            <StatisticsPage />
          </Suspense>
        } />
        <Route path="meal" element={
          <Suspense fallback={<PageLoader />}>
            <MealPage />
          </Suspense>
        } />
        <Route path="shopping-list" element={
          <Suspense fallback={<PageLoader />}>
            <ShoppingListPage />
          </Suspense>
        } />
        <Route path="recipes" element={
          <Suspense fallback={<PageLoader />}>
            <RecipesPage />
          </Suspense>
        } />
        <Route path="prepared-meals" element={
          <Suspense fallback={<PageLoader />}>
            <PreparedMealsPage />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
}

export default App;