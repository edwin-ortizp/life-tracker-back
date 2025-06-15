import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface AiLoadingBarProps {
  className?: string;
}

export const AiLoadingBar: React.FC<AiLoadingBarProps> = ({ className }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setValue(v => {
        const next = v + 5;
        if (next >= 100) {
          clearInterval(id);
          return 100;
        }
        return next;
      });
    }, 300);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Progress value={value} className="flex-1" />
      <span className="text-xs text-muted-foreground w-8 text-right">
        {value}%
      </span>
    </div>
  );
};

export default AiLoadingBar;
