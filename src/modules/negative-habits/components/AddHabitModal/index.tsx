// src/modules/negative-habits/components/AddHabitModal/index.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatDateToSpanishWithUTC } from '@/shared/utils/dates';
import { HabitGrid } from './HabitGrid';
import { AddHabitModalProps } from '../../models';

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onLogHabit,
  selectedDate
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Registrar Hábito Negativo</DialogTitle>
          <p className="text-sm text-gray-500">
            {formatDateToSpanishWithUTC(selectedDate)}
          </p>
        </DialogHeader>
        <div className="flex-1 overflow-hidden py-4">
          <HabitGrid 
            onSelectHabit={onLogHabit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};