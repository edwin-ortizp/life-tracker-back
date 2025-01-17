import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import HydrationPage from './pages/HydrationPage';
import PomodoroPage from './pages/PomodoroPage';
import Home from './artifacts/Home';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="hydration" element={<HydrationPage />} />
        <Route path="pomodoro" element={<PomodoroPage />} />
      </Route>
    </Routes>
  );
}

export default App;