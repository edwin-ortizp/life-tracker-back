import React, { useState } from 'react';
import DateSelector from '@/components/DateSelector';
import Water from '@/features/water/components';
import { Card } from '@/components/ui/card';

const WaterPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DateSelector
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />
      
      <Water selectedDate={selectedDate} />
    </div>
  );
};

export default WaterPage;