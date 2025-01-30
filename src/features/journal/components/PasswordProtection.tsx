import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { LastUpdatedInfo } from './LastUpdatedInfo';

interface PasswordProtectionProps {
  onUnlock: () => void;
  lastUpdated?: string;
}

export const PasswordProtection: React.FC<PasswordProtectionProps> = ({ 
  onUnlock,
  lastUpdated 
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      onUnlock();
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <Lock className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-center text-lg font-medium">Diario Protegido</h3>
          <p className="text-center text-sm text-gray-500">
            Ingresa la contraseña para acceder a tu diario
          </p>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className={error ? 'border-red-500' : ''}
          />
          {error && (
            <p className="text-sm text-red-500 text-center">
              Contraseña incorrecta
            </p>
          )}
          <Button type="submit" className="w-full">
            Desbloquear
          </Button>
          
          <LastUpdatedInfo lastUpdated={lastUpdated} className="justify-center" />
        </form>
      </CardContent>
    </Card>
  );
};