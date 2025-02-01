// src/features/negative-habits/components/AddHabitModal/index.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateToSpanishWithUTC } from '@/utils/dates';
import { HabitGrid } from './HabitGrid';
import { AddHabitModalProps } from '../../types';

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onLogHabit,
  selectedDate
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Registrar Hábito Negativo</DialogTitle>
          <p className="text-sm text-gray-500">
            {formatDateToSpanishWithUTC(selectedDate)}
          </p>
        </DialogHeader>
        <div className="py-4">
          <HabitGrid 
            onSelectHabit={onLogHabit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};