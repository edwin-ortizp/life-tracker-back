import { useState } from 'react';
import { Pomodoro } from '@/features/pomodoro/components';
import Water from './Water';
import Habit from './Habit';
import Mood from './Mood';
import Diary from './Diary';
import Task from './Task';
import Auth from '../components/Auth';
import DateSelector from '../components/DateSelector';

const DailyTrackerApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Daily Tracker</h1>
          </div>
          <Auth />
        </header>

        <DateSelector 
          selectedDate={selectedDate} 
          onChange={setSelectedDate} 
        />

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Pomodoro selectedDate={selectedDate} />
              <Water selectedDate={selectedDate} />
            </div>
            <Habit selectedDate={selectedDate} />
            <Task selectedDate={selectedDate} />
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Mood selectedDate={selectedDate} />
            <div className="h-96">
              <Diary selectedDate={selectedDate} />
            </div>
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
          <div className="grid grid-cols-5 gap-1 p-2">
            {['⏱️', '💧', '✓', '😊', '📔'].map((icon, index) => (
              <button
                key={index}
                className="p-2 text-center hover:bg-gray-100 rounded"
              >
                {icon}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default DailyTrackerApp;