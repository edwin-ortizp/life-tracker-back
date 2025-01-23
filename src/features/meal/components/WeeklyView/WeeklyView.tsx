// features/meal/components/WeeklyView/WeeklyView.tsx
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MEAL_TYPES } from '../../types';
import { getWeekDays, getNextWeek, getPreviousWeek } from '../../utils/dateUtils';
import { WeeklyViewProps, MealModalState, MealFormData } from './types';
import WeekNavigation from './WeekNavigation';
import MobileDay from './MobileDay';
import DesktopDay from './DesktopDay';
import MealModal from './MealModal';

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  mealPlan,
  onAddMeal,
  onRemoveMeal,
  disabled,
  selectedDate: initialDate = new Date()
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [showModal, setShowModal] = useState(false);
  const [selectedMealInfo, setSelectedMealInfo] = useState<MealModalState | null>(null);
  const [formData, setFormData] = useState<MealFormData>({
    type: 'breakfast',
    name: '',
    notes: '',
    recipe: ''
  });

  const weekDays = getWeekDays(currentDate);

  const handleNavigateWeek = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next' 
      ? getNextWeek(currentDate)
      : getPreviousWeek(currentDate);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openModal = (date: string, type: MealFormData['type'], meal?: MealModalState['meal']) => {
    setSelectedMealInfo({ date, type, meal });
    setFormData({
      type: meal?.type || type,
      name: meal?.name || '',
      notes: meal?.notes || '',
      recipe: meal?.recipe || ''
    });
    setShowModal(true);
  };

  const handleFormChange = (field: keyof MealFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
        recipe: formData.recipe
      });
      
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la comida');
    }
  };

  const handleDelete = async () => {
    if (!selectedMealInfo?.meal) return;
    
    try {
      // Usar el tipo de la comida original, no el del formulario
      await onRemoveMeal(selectedMealInfo.date, selectedMealInfo.meal.type);
      setShowModal(false);
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la comida');
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <WeekNavigation
        currentDate={currentDate}
        onNavigateWeek={handleNavigateWeek}
        onGoToToday={goToToday}
      />

      {/* Vista móvil */}
      <div className="md:hidden flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="pb-16"> {/* Espacio para evitar que el contenido quede bajo la navegación móvil */}
            {weekDays.map(day => (
              <MobileDay
                key={day.fullDate}
                day={day}
                mealPlan={mealPlan}
                onOpenModal={openModal}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Vista desktop */}
      <div className="hidden md:block flex-1 overflow-x-auto">
        <div className="grid grid-cols-8 divide-x divide-gray-100 min-w-[1000px]">
          {/* Columna de títulos de comidas */}
          <div className="pr-2">
            {Object.entries(MEAL_TYPES)
              .sort(([,a], [,b]) => a.order - b.order)
              .map(([type, config]) => (
                <div key={type} className="h-32 flex items-center">
                  <div className="flex items-center gap-2">
                    <config.icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">{config.title}</span>
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

      {/* Modal de comida */}
      <MealModal
        show={showModal}
        onClose={() => setShowModal(false)}
        selectedMealInfo={selectedMealInfo}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        weekDays={weekDays}
      />
    </div>
  );
};

export default WeeklyView;