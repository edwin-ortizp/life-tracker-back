import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface JournalInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const JournalInput: React.FC<JournalInputProps> = ({ value, onChange }) => {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="¿Cómo ha sido tu día?"
      className="w-full h-64 resize-none"
    />
  );
};