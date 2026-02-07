import { useState } from 'react';

export const useHomeController = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return {
    selectedDate,
    setSelectedDate
  };
};
