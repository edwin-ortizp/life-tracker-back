import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import WaterPage from './pages/WaterPage'; 
import PomodoroPage from './pages/PomodoroPage';
import MoodPage from './pages/MoodPage';
import JournalPage from './pages/JournalPage';
import TaskPage from './pages/TaskPage';
import HabitPage from './pages/HabitPage';
import MealPage from './pages/MealPage';
import Home from './artifacts/Home';
import ExercisePage from './pages/ExercisePage';
import NegativeHabitsPage from './pages/NegativeHabitsPage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="habit" element={<HabitPage />} />
        <Route path="task" element={<TaskPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="mood" element={<MoodPage />} />
        <Route path="water" element={<WaterPage />} />
        <Route path="pomodoro" element={<PomodoroPage />} />
        <Route path="exercise" element={<ExercisePage />} />
        <Route path="negative" element={<NegativeHabitsPage />} />
        <Route path="meal" element={<MealPage />} />
      </Route>
    </Routes>
  );
}

export default App;