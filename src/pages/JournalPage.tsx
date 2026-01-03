// src/pages/JournalPage.tsx
import React, { useState } from 'react';
import { Journal } from '@/features/journal/components';
import DateSelector from '@/components/DateSelector';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';

const JournalPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold">Inicia sesión para acceder a tu diario</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diario Personal</h1>
        <p className="text-gray-500">Registra tus pensamientos y reflexiones diarias</p>
      </div>

      <div className="mt-6">
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />
        <div className="mt-4">
          <Journal selectedDate={selectedDate} />
        </div>
      </div>
    </PageLayout>
  );
};

export default JournalPage;
