// src/features/water/components/index.tsx
import React, {  } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export const HydrationPage: React.FC = () => {
  const { user } = useAuth();


  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tu hidratación</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
    </Card>
  );
};

// Default export for the main component
export default HydrationPage;