// features/meal/components/WeeklyView/WeeklyView.tsx
import React, { useState } from 'react';
import { MEAL_TYPES } from '../../types';
import { MEAL_HOURS } from '../../utils/dateUtils';
import { useToast } from '@/components/ui/use-toast';
import { getWeekDays } from '@/utils/dates';
import { WeeklyViewProps, MealModalState, MealFormData } from './types';
import MobileDay from './MobileDay';
import DesktopDay from './DesktopDay';
import MealModal from './MealModal';
import type { Meal } from '../../types';

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  mealPlan,
  onAddMeal,
  onRemoveMeal,
  disabled,
  selectedDate: initialDate = new Date()
}) => {  const { toast } = useToast();
  const currentDate = initialDate;
  const [showModal, setShowModal] = useState(false);
  const [selectedMealInfo, setSelectedMealInfo] = useState<MealModalState | null>(null);
  const [formData, setFormData] = useState<MealFormData>({
    type: 'breakfast',
    name: '',
    notes: '',
    recipe: '',
    calories: undefined
  });  const weekDays = getWeekDays(currentDate);

  const openModal = (date: string, type: MealFormData['type'], meal?: MealModalState['meal']) => {
    setSelectedMealInfo({ date, type, meal });
    setFormData({
      type: meal?.type || type,
      name: meal?.name || '',
      notes: meal?.notes || '',
      recipe: meal?.recipe || '',
      calories: meal?.calories
    });
    setShowModal(true);
  };

  const handleFormChange = (field: keyof MealFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'calories' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedMealInfo) return;

    try {
      // Si existe una comida previa y el tipo ha cambiado, eliminar la anterior
      if (selectedMealInfo.meal && selectedMealInfo.meal.type !== formData.type) {
        await onRemoveMeal(selectedMealInfo.date, selectedMealInfo.meal.type);
      }
      
      await onAddMeal(selectedMealInfo.date, formData.type, {
        type: formData.type,
        name: formData.name,
        notes: formData.notes,
        recipe: formData.recipe,
        calories: formData.calories
      });
      
      setShowModal(false);
    } catch (err) { // Renamed error to err
      console.error('Error al guardar:', err);
      toast({ title: "Error al Guardar", description: "No se pudo guardar la comida.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedMealInfo?.meal) return;
    
    try {
      // Usar el tipo de la comida original, no el del formulario
      await onRemoveMeal(selectedMealInfo.date, selectedMealInfo.meal.type);
      setShowModal(false);
    } catch (err) { // Renamed error to err
      console.error('Error al eliminar:', err);
      toast({ title: "Error al Eliminar", description: "No se pudo eliminar la comida.", variant: "destructive" });
    }
  };

  const overwriteDay = async (date: string, meals: Record<Meal['type'], Omit<Meal, 'id'>>) => {
    for (const [type, meal] of Object.entries(meals) as [Meal['type'], Omit<Meal, 'id'>][]) {
      await onAddMeal(date, type, meal);
    }

    if (selectedMealInfo) {
      const current = meals[selectedMealInfo.type];
      if (current) {
        setFormData({
          type: selectedMealInfo.type,
          name: current.name,
          notes: current.notes || '',
          recipe: current.recipe || '',
          calories: current.calories
        });
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Vista móvil - Mejorada */}
      <div className="md:hidden flex-1 overflow-y-auto">
        <div className="pb-20 px-2"> {/* Espacio para navegación móvil */}
          {weekDays.map(day => (
            <MobileDay
              key={day.fullDate}
              day={day}
              mealPlan={mealPlan}
              onOpenModal={openModal}
            />
          ))}
        </div>
      </div>      {/* Vista desktop - Mejorada para mejor aprovechamiento del espacio */}
      <div className="hidden md:block flex-1 overflow-auto">
        <div className="min-h-full p-4 lg:p-6 xl:p-8">
          <div className="grid grid-cols-8 gap-2 lg:gap-4 xl:gap-6 min-w-[900px] lg:min-w-[1200px] xl:min-w-[1400px] h-full">
            {/* Columna de títulos de comidas */}
            <div className="bg-gray-50 rounded-lg p-3 lg:p-4 xl:p-6">
              {Object.entries(MEAL_TYPES)
                .sort(([,a], [,b]) => a.order - b.order)
                .map(([type, config]) => (
                  <div key={type} className="h-32 lg:h-36 xl:h-40 flex items-center justify-center border-b border-gray-200 last:border-b-0">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <config.icon className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-gray-600" />
                      <span className="font-medium text-sm lg:text-base">{config.title}</span>
                      <span className="text-xs lg:text-sm text-gray-500">
                        {MEAL_HOURS[type as keyof typeof MEAL_HOURS]}:00
                      </span>
                    </div>
                  </div>
              ))}
            </div>

            {/* Columnas de días */}
            {weekDays.map(day => (
              <DesktopDay
                key={day.fullDate}
                day={day}
                mealPlan={mealPlan}
                disabled={disabled}
                onOpenModal={openModal}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal de comida */}
      <MealModal
        show={showModal}
        onClose={() => setShowModal(false)}
        selectedMealInfo={selectedMealInfo}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onOverwriteDay={overwriteDay}
        weekDays={weekDays}
      />
    </div>
  );
};

export default WeeklyView;