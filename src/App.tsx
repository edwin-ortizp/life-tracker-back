import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/shared/layouts/AppLayout';
import { useAuth } from '@/shared/hooks/useAuth';

// Importación directa de páginas para carga inicial más rápida
import Home from './artifacts/Home';
import PomodoroPage from './modules/pomodoro/PomodoroPage';
import MoodPage from './modules/mood/MoodPage';
import TaskPage from './modules/task/TaskPage';
import HabitPage from './modules/habit/HabitPage';
import MealPage from './modules/meal/MealPage';
import ShoppingListPage from './modules/shopping-list/ShoppingListPage';
import RecipesPage from './modules/recipe/RecipesPage';
import RecipeDetailPage from './modules/recipe/RecipeDetailPage';
import PreparedMealsPage from './modules/prepared-meals/PreparedMealsPage';
import ExercisePage from './modules/exercise/ExercisePage';
import WaterPage from './modules/water/WaterPage';
import JournalPage from './modules/journal/JournalPage';
import NegativeHabitsPage from './modules/negative-habits/NegativeHabitsPage';
import SettingsPage from './modules/settings/SettingsPage';
import HabitRunPage from './modules/habit/HabitRunPage';
import ShoppingRunPage from './modules/shopping-list/ShoppingRunPage';
import TaskRunPage from './modules/task/TaskRunPage';
import GoalsPage from './modules/goals/GoalsPage';
import LoginPage from './modules/auth/LoginPage';
import ExerciseConfigPage from './modules/exercise/ExerciseConfigPage';
import TaskConfigPage from './modules/task/TaskConfigPage';
import HabitConfigPage from './modules/habit/HabitConfigPage';
import MoodConfigPage from './modules/mood/MoodConfigPage';
import WaterConfigPage from './modules/water/WaterConfigPage';
import PomodoroConfigPage from './modules/pomodoro/PomodoroConfigPage';
import JournalConfigPage from './modules/journal/JournalConfigPage';
import NegativeHabitsConfigPage from './modules/negative-habits/NegativeHabitsConfigPage';
import MealConfigPage from './modules/meal/MealConfigPage';
import ShoppingListConfigPage from './modules/shopping-list/ShoppingListConfigPage';
import RecipesConfigPage from './modules/recipe/RecipesConfigPage';
import PreparedMealsConfigPage from './modules/prepared-meals/PreparedMealsConfigPage';
import StatisticsPage from './modules/statistics/StatisticsPage';

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
        <Route path="habit" element={<Navigate to="/habit/view/tracker" replace />} />
        <Route path="habit/view/:viewKey" element={<HabitPage />} />
        <Route path="habit/config" element={<HabitConfigPage />} />
        {/* Task routes - Airtable style views */}
        <Route path="task" element={<Navigate to="/task/view/list" replace />} />
        <Route path="task/view/:viewKey" element={<TaskPage />} />
        <Route path="task/config" element={<TaskConfigPage />} />
        <Route path="task/:taskId/run" element={<TaskRunPage />} />
        {/* Legacy redirects */}
        <Route path="task/list" element={<Navigate to="/task/view/list" replace />} />
        <Route path="task/kanban" element={<Navigate to="/task/view/kanban" replace />} />
        <Route path="task/calendar" element={<Navigate to="/task/view/calendar" replace />} />
        <Route path="tasks/calendar" element={<Navigate to="/task/view/calendar" replace />} />
        <Route path="kanban" element={<Navigate to="/task/view/kanban" replace />} />
        <Route path="mood" element={<Navigate to="/mood/view/tracker" replace />} />
        <Route path="mood/view/:viewKey" element={<MoodPage />} />
        <Route path="mood/config" element={<MoodConfigPage />} />
        <Route path="pomodoro" element={<Navigate to="/pomodoro/view/timer" replace />} />
        <Route path="pomodoro/view/:viewKey" element={<PomodoroPage />} />
        <Route path="pomodoro/config" element={<PomodoroConfigPage />} />
        <Route path="exercise" element={<Navigate to="/exercise/view/daily" replace />} />
        <Route path="exercise/view/:viewKey" element={<ExercisePage />} />
        <Route path="exercise/config" element={<ExerciseConfigPage />} />
        <Route path="water" element={<Navigate to="/water/view/daily" replace />} />
        <Route path="water/view/:viewKey" element={<WaterPage />} />
        <Route path="water/config" element={<WaterConfigPage />} />
        <Route path="journal" element={<Navigate to="/journal/view/entries" replace />} />
        <Route path="journal/view/:viewKey" element={<JournalPage />} />
        <Route path="journal/config" element={<JournalConfigPage />} />
        <Route path="negative" element={<Navigate to="/negative/view/weekly" replace />} />
        <Route path="negative/view/:viewKey" element={<NegativeHabitsPage />} />
        <Route path="negative/config" element={<NegativeHabitsConfigPage />} />
        <Route path="meal" element={<Navigate to="/meal/view/weekly" replace />} />
        <Route path="meal/view/:viewKey" element={<MealPage />} />
        <Route path="meal/config" element={<MealConfigPage />} />
        <Route path="shopping-list" element={<Navigate to="/shopping-list/view/list" replace />} />
        <Route path="shopping-list/view/:viewKey" element={<ShoppingListPage />} />
        <Route path="shopping-list/config" element={<ShoppingListConfigPage />} />
        <Route path="shopping-list/list" element={<Navigate to="/shopping-list/view/list" replace />} />
        <Route path="shopping-list/kanban" element={<Navigate to="/shopping-list/view/kanban" replace />} />
        <Route path="recipes" element={<Navigate to="/recipes/view/list" replace />} />
        <Route path="recipes/view/:viewKey" element={<RecipesPage />} />
        <Route path="recipes/config" element={<RecipesConfigPage />} />
        <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
        <Route path="prepared-meals" element={<Navigate to="/prepared-meals/view/list" replace />} />
        <Route path="prepared-meals/view/:viewKey" element={<PreparedMealsPage />} />
        <Route path="prepared-meals/config" element={<PreparedMealsConfigPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/:goalId" element={<GoalsPage />} />
        <Route path="stats" element={<StatisticsPage />} />
      </Route>
      <Route path="habit/:habitId/run" element={<HabitRunPage />} />
      <Route path="shopping/run" element={<ShoppingRunPage />} />
    </Routes>
  );
}
export default App;
