import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';

// Importación directa de páginas para carga inicial más rápida
import Home from './artifacts/Home';
import PomodoroPage from './pages/PomodoroPage';
import MoodPage from './pages/MoodPage';
import TaskPage from './pages/TaskPage';
import TaskCalendarPage from './pages/TaskCalendarPage';
import HabitPage from './pages/HabitPage';
import MealPage from './pages/MealPage';
import ShoppingListPage from './pages/ShoppingListPage';
import RecipesPage from './pages/RecipesPage';
import PreparedMealsPage from './pages/PreparedMealsPage';
import ExercisePage from './pages/ExercisePage';
import WaterPage from './pages/WaterPage';
import JournalPage from './pages/JournalPage';
import NegativeHabitsPage from './pages/NegativeHabitsPage';
import SettingsPage from './pages/SettingsPage';
import HabitRunPage from './pages/HabitRunPage';
import ShoppingRunPage from './pages/ShoppingRunPage';
import GoalsPage from './pages/GoalsPage';
import LoginPage from './pages/LoginPage';
import ExerciseConfigPage from './pages/ExerciseConfigPage';
import WaterConfigPage from './pages/WaterConfigPage';
import MoodConfigPage from './pages/MoodConfigPage';

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <PageLoader />;
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show main app if authenticated
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="habit" element={<HabitPage />} />
        {/* Task routes - independent views */}
        <Route path="task" element={<Navigate to="/task/list" replace />} />
        <Route path="task/list" element={<TaskPage />} />
        <Route path="task/kanban" element={<TaskPage />} />
        <Route path="task/calendar" element={<TaskCalendarPage />} />
        {/* Legacy redirects */}
        <Route path="tasks/calendar" element={<Navigate to="/task/calendar" replace />} />
        <Route path="kanban" element={<Navigate to="/task/kanban" replace />} />
        <Route path="mood" element={<MoodPage />} />
        <Route path="pomodoro" element={<PomodoroPage />} />
        <Route path="exercise" element={<ExercisePage />} />
        <Route path="exercise/config" element={<ExerciseConfigPage />} />
        <Route path="water" element={<WaterPage />} />
        <Route path="water/config" element={<WaterConfigPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="mood/config" element={<MoodConfigPage />} />
        <Route path="negative" element={<NegativeHabitsPage />} />
        <Route path="meal" element={<MealPage />} />
        <Route path="shopping-list" element={<ShoppingListPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="prepared-meals" element={<PreparedMealsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/:goalId" element={<GoalsPage />} />
      </Route>
      <Route path="habit/:habitId/run" element={<HabitRunPage />} />
      <Route path="shopping/run" element={<ShoppingRunPage />} />
    </Routes>
  );
}
export default App;
