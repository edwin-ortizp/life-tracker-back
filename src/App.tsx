import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import HydrationPage from './pages/HydrationPage';
import PomodoroPage from './pages/PomodoroPage';
import MoodPage from './pages/MoodPage';
import DiaryPage from './pages/DiaryPage';
import TaskPage from './pages/TaskPage';
import HabitPage from './pages/HabitPage';
import Home from './artifacts/Home';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="habit" element={<HabitPage />} />
        <Route path="task" element={<TaskPage />} />
        <Route path="diary" element={<DiaryPage />} />
        <Route path="mood" element={<MoodPage />} />
        <Route path="hydration" element={<HydrationPage />} />
        <Route path="pomodoro" element={<PomodoroPage />} />
      </Route>
    </Routes>
  );
}

export default App;