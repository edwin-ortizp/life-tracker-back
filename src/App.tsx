import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import WaterPage from './pages/WaterPage'; 
import PomodoroPage from './pages/PomodoroPage';
import MoodPage from './pages/MoodPage';
import JournalPage from './pages/JournalPage';
import TaskPage from './pages/TaskPage';
import KanbanPage from './pages/KanbanPage';
import HabitPage from './pages/HabitPage';
import MealPage from './pages/MealPage';
import ShoppingListPage from './pages/ShoppingListPage';
import RecipesPage from './pages/RecipesPage';
import Home from './artifacts/Home';
import ExercisePage from './pages/ExercisePage';
import NegativeHabitsPage from './pages/NegativeHabitsPage';
import StatisticsPage from './pages/StatisticsPage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="habit" element={<HabitPage />} />
        <Route path="task" element={<TaskPage />} />
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
      </Route>
    </Routes>
  );
}

export default App;