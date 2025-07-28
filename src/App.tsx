import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';

// Importación directa de páginas para carga inicial más rápida
import Home from './artifacts/Home';
import WaterPage from './pages/WaterPage';
import PomodoroPage from './pages/PomodoroPage';
import MoodPage from './pages/MoodPage';
import JournalPage from './pages/JournalPage';
import TaskPage from './pages/TaskPage';
import TaskCalendarPage from './pages/TaskCalendarPage';
import KanbanPage from './pages/KanbanPage';
import HabitPage from './pages/HabitPage';
import MealPage from './pages/MealPage';
import ShoppingListPage from './pages/ShoppingListPage';
import RecipesPage from './pages/RecipesPage';
import PreparedMealsPage from './pages/PreparedMealsPage';
import ExercisePage from './pages/ExercisePage';
import NegativeHabitsPage from './pages/NegativeHabitsPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import TaskRunPage from './pages/TaskRunPage';
import HabitRunPage from './pages/HabitRunPage';
import ShoppingRunPage from './pages/ShoppingRunPage';
import GoalsPage from './pages/GoalsPage';

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="habit" element={<HabitPage />} />
        <Route path="task" element={<TaskPage />} />
        <Route path="tasks/calendar" element={<TaskCalendarPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="mood" element={<MoodPage />} />
        <Route path="water" element={<WaterPage />} />
        <Route path="pomodoro" element={<PomodoroPage />} />
        <Route path="exercise" element={<ExercisePage />} />
        <Route path="negative" element={<NegativeHabitsPage />} />
        <Route path="stats" element={<StatisticsPage />} />
        <Route path="meal" element={<MealPage />} />
        <Route path="shopping-list" element={<ShoppingListPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="prepared-meals" element={<PreparedMealsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/:goalId" element={<GoalsPage />} />
      </Route>
      <Route path="task/:taskCode/run" element={<TaskRunPage />} />
      <Route path="habit/:habitId/run" element={<HabitRunPage />} />
      <Route path="shopping/run" element={<ShoppingRunPage />} />
    </Routes>
  );
}
export default App;
