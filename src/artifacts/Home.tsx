import { useState } from 'react';
import { Pomodoro } from '@/features/pomodoro/components';
import { Water } from '@/features/water/components';
import { Habit } from '@/features/habit/components';
import { Mood } from '@/features/mood/components';
import { Diary } from '@/features/diary/components';
import { Task } from '@/features/task/components';
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
            <Task selectedDate={selectedDate}/>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Mood selectedDate={selectedDate} />
            <div className="h-96">
              <Diary selectedDate={selectedDate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTrackerApp;