import React, { useState } from 'react';
import DateSelector from '@/components/DateSelector';
import Water from '@/features/water/components';
import PageLayout from '@/components/PageLayout';

const WaterPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <PageLayout>
      <DateSelector
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />
      
      <Water selectedDate={selectedDate} />
    </PageLayout>
  );
};

export default WaterPage;