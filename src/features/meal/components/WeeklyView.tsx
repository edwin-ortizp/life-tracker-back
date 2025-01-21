import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, X } from 'lucide-react';
import { MEAL_TYPES, MealPlan, Meal } from '../types';
import { getWeekDays } from '../utils/dateUtils';

interface WeeklyViewProps {
  mealPlan: MealPlan;
  onAddMeal: (date: string, type: Meal['type'], meal: Omit<Meal, 'id'>) => void;
  onRemoveMeal: (date: string, type: Meal['type']) => void;
  disabled?: boolean;
  selectedDate?: Date;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  mealPlan,
  onAddMeal,
  onRemoveMeal,
  disabled,
  selectedDate
}) => {
  const weekDays = getWeekDays(selectedDate);
  const [showModal, setShowModal] = useState(false);
  const [selectedMealInfo, setSelectedMealInfo] = useState<{
    date: string;
    type: Meal['type'];
    meal?: Meal;
  } | null>(null);
  const [formData, setFormData] = useState({
    type: 'breakfast' as Meal['type'],
    name: '',
    notes: ''
  });

  const openModal = (date: string, type: Meal['type'], meal?: Meal) => {
    setSelectedMealInfo({ date, type, meal });
    setFormData({
      type: meal?.type || type,
      name: meal?.name || '',
      notes: meal?.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedMealInfo) return;

    try {
      if (selectedMealInfo.meal) {
        await onRemoveMeal(selectedMealInfo.date, selectedMealInfo.meal.type);
      }
      
      await onAddMeal(selectedMealInfo.date, formData.type, {
        type: formData.type,
        name: formData.name,
        notes: formData.notes
      });
      
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la comida');
    }
  };

  const handleDelete = async () => {
    if (!selectedMealInfo?.date || !selectedMealInfo?.type) return;
    
    try {
      await onRemoveMeal(selectedMealInfo.date, selectedMealInfo.type);
      setShowModal(false);
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la comida');
    }
  };

  return (
    <div className="w-full">
      <div className="min-w-full">
        <div className="grid grid-cols-8 divide-x divide-gray-100">
          <div className="pr-2">
            {Object.entries(MEAL_TYPES).map(([type, config]) => (
              <div key={type} className="h-32 flex items-center">
                <div className="flex items-center gap-2">
                  <config.icon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">{config.title}</span>
                </div>
              </div>
            ))}
          </div>

          {weekDays.map(day => (
            <div key={day.fullDate} className="px-2">
              <div className="text-center py-2 border-b">
                <div className="font-medium">{day.dayName}</div>
                <div className="text-xs text-gray-500">
                  {day.fullDate.split('-').slice(1).join('/')}
                </div>
              </div>

              {(Object.keys(MEAL_TYPES) as Array<keyof typeof MEAL_TYPES>).map(type => {
                const meal = mealPlan[day.fullDate]?.[type];
                const { color, hoverColor } = MEAL_TYPES[type];

                return (
                  <div key={type} className="h-32 py-2">
                    {meal ? (
                      <div 
                        className={`h-full p-2 rounded ${color} relative group cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md`}
                        onClick={() => openModal(day.fullDate, type, meal)}
                      >
                        <p className="text-sm font-medium line-clamp-2">{meal.name}</p>
                        {meal.notes && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-3">{meal.notes}</p>
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center 
                          bg-white/50 opacity-0 group-hover:opacity-100 rounded transition-opacity ${hoverColor}`}>
                          <Edit2 className="h-4 w-4 text-gray-700" />
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-full border-dashed"
                        onClick={() => openModal(day.fullDate, type)}
                        disabled={disabled}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedMealInfo?.meal ? 'Editar Comida' : 'Agregar Comida'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Comida
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as Meal['type']})}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  {Object.entries(MEAL_TYPES).map(([value, { title }]) => (
                    <option key={value} value={value}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Comida
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Ej: Ensalada César"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full rounded-md border border-gray-300 p-2 h-24"
                  placeholder="Ej: Con pollo a la plancha"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              {selectedMealInfo?.meal && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que deseas eliminar esta comida?')) {
                      handleDelete();
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Eliminar
                </Button>
              )}
              <div className="flex space-x-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.name}
                  className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                >
                  {selectedMealInfo?.meal ? 'Actualizar' : 'Agregar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyView;