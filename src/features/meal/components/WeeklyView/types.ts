// features/meal/components/WeeklyView/types.ts
import { Meal, MealPlan } from '../../types';

export interface DayInfo {
  dayName: string;
  fullDate: string;
  isCurrentMonth: boolean;
  date: Date;
}

export interface WeeklyViewProps {
  mealPlan: MealPlan;
  onAddMeal: (date: string, type: Meal['type'], meal: Omit<Meal, 'id'>) => Promise<void>;
  onRemoveMeal: (date: string, type: Meal['type']) => Promise<void>;
  disabled?: boolean;
  selectedDate?: Date;
}

export interface MealModalState {
  date: string;
  type: Meal['type'];
  meal?: Meal;
}

export interface MealFormData {
  type: Meal['type'];
  name: string;
  notes: string;
  recipe: string;
}

export interface MobileDayProps {
  day: Pick<DayInfo, 'dayName' | 'fullDate'>;
  mealPlan: MealPlan;
  onOpenModal: (date: string, type: Meal['type'], meal?: Meal) => void;
}

export interface DesktopDayProps {
  day: DayInfo;
  mealPlan: MealPlan;
  disabled?: boolean;
  onOpenModal: (date: string, type: Meal['type'], meal?: Meal) => void;
}

export interface MealCellProps {
  date: string;
  type: Meal['type'];
  meal?: Meal;
  disabled?: boolean;
  onOpenModal: (date: string, type: Meal['type'], meal?: Meal) => void;
}

export interface MealModalProps {
  show: boolean;
  onClose: () => void;
  selectedMealInfo: MealModalState | null;
  formData: MealFormData;
  onFormChange: (field: keyof MealFormData, value: string) => void;
  onSubmit: () => Promise<void>;
  onDelete: () => Promise<void>;
  onOverwriteDay: (date: string, meals: Record<Meal['type'], Omit<Meal, 'id'>>) => Promise<void>;
  weekDays: DayInfo[];
}