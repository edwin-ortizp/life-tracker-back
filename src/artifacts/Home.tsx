import { useState } from 'react';
import { Pomodoro } from '@/features/pomodoro/components';
import { Water } from '@/features/water/components';
import { Habit } from '@/features/habit/components';
import { Mood } from '@/features/mood/components';
import { Journal } from '@/features/journal/components';
import { Task } from '@/features/task/components';
import Auth from '../components/Auth';
import DateSelector from '../components/DateSelector';
import PageLayout from '@/components/PageLayout';

const DailyTrackerApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <PageLayout>
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
        </div>
        
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Mood selectedDate={selectedDate} />
        </div>
        
        <div className="col-span-12 space-y-8">
          <Journal selectedDate={selectedDate} />
        </div>
        
        <div className="col-span-12 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Habit selectedDate={selectedDate} />
            <Task selectedDate={selectedDate} />
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Auth />
      </div>
    </PageLayout>
  );
};

export default DailyTrackerApp;