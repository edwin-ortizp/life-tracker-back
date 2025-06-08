// src/features/exercise/components/ExerciseFormModal.tsx
import React, { useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseLog, EXERCISES, EXERCISE_CATEGORIES } from '../types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ExerciseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exerciseLog: ExerciseLog) => void;
  initialData?: ExerciseLog;
  selectedDate: Date;
}

export const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [selectedExercise, setSelectedExercise] = React.useState(
    initialData ? EXERCISES.find(e => e.id === initialData.exerciseId) : null
  );
  
  const [formData, setFormData] = React.useState({
    sets: initialData?.sets?.toString() || '',
    reps: initialData?.reps?.toString() || '',
    weight: initialData?.weight?.toString() || '',
    duration: initialData?.duration?.toString() || '',
    distance: initialData?.distance?.toString() || '',
    steps: initialData?.steps?.toString() || '',
    notes: initialData?.notes || ''
  });

  const [calculatedCalories, setCalculatedCalories] = React.useState<number>(0);

  useEffect(() => {
    calculateCalories();
    if (selectedExercise?.stepsPerKm && formData.distance) {
      const distance = parseFloat(formData.distance);
      const steps = Math.round(distance * selectedExercise.stepsPerKm);
      setFormData(prev => ({ ...prev, steps: steps.toString() }));
    }
  }, [formData.distance, formData.duration, selectedExercise]);

  const calculateCalories = () => {
    if (!selectedExercise?.caloriesPerHour) return;

    let duration = parseInt(formData.duration) || 0;
    
    if (!duration && formData.sets && formData.reps) {
      duration = (parseInt(formData.sets) * parseInt(formData.reps) * 3) / 60;
    }

    let calories = (selectedExercise.caloriesPerHour * duration) / 60;

    if (formData.weight && selectedExercise.category === 'strength') {
      const weightFactor = parseInt(formData.weight) / 5;
      calories *= (1 + weightFactor * 0.1);
    }

    setCalculatedCalories(Math.round(calories));
  };

  const handleSelectExercise = (exercise: typeof EXERCISES[number]) => {
    setSelectedExercise(exercise);
    setFormData({
      sets: exercise.defaultSets?.toString() || '',
      reps: exercise.defaultReps?.toString() || '',
      weight: '',
      duration: exercise.defaultDuration?.toString() || '',
      distance: exercise.defaultDistance ? (exercise.defaultDistance / 1000).toString() : '',
      steps: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    const exerciseLog: ExerciseLog = {
      exerciseId: selectedExercise.id,
      calories: calculatedCalories,
      ...(formData.sets && { sets: parseInt(formData.sets) }),
      ...(formData.reps && { reps: parseInt(formData.reps) }),
      ...(formData.weight && { weight: parseFloat(formData.weight) }),
      ...(formData.duration && { duration: parseInt(formData.duration) }),
      ...(formData.distance && { distance: parseFloat(formData.distance) * 1000 }),
      ...(formData.steps && { steps: parseInt(formData.steps) }),
      ...(formData.notes && { notes: formData.notes })
    };

    onSubmit(exerciseLog);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] sm:h-auto overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedExercise && !initialData && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedExercise(null)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {initialData ? 'Editar ejercicio' : 'Agregar ejercicio'}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {!selectedExercise ? (
            <Tabs defaultValue="cardio" className="w-full">
              <TabsList className="w-full h-12 grid grid-cols-3 mb-4">
                {Object.entries(EXERCISE_CATEGORIES).map(([key, category]) => (
                  <TabsTrigger 
                    key={key} 
                    value={key} 
                    className="flex items-center gap-2 text-base p-3"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(EXERCISE_CATEGORIES).map(([category]) => (
                <TabsContent key={category} value={category} className="mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {EXERCISES.filter(e => e.category === category).map((exercise) => (
                      <Button
                        key={exercise.id}
                        type="button"
                        variant="outline"
                        className="flex flex-col items-center p-6 h-auto gap-3"
                        onClick={() => handleSelectExercise(exercise)}
                      >
                        <span className="text-3xl">{exercise.icon}</span>
                        <span className="text-sm font-normal text-center">{exercise.name}</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{selectedExercise.icon}</span>
                <div>
                  <h4 className="font-medium text-lg">{selectedExercise.name}</h4>
                  <p className="text-sm text-gray-500">{selectedExercise.description}</p>
                </div>
              </div>

              {selectedExercise.category === 'strength' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sets">Series</Label>
                    <Input
                      id="sets"
                      type="number"
                      min="1"
                      value={formData.sets}
                      onChange={e => setFormData(prev => ({ ...prev, sets: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reps">Repeticiones</Label>
                    <Input
                      id="reps"
                      type="number"
                      min="1"
                      value={formData.reps}
                      onChange={e => setFormData(prev => ({ ...prev, reps: e.target.value }))}
                    />
                  </div>
                  {selectedExercise.name === 'Pesas de mano' && (
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.weight}
                        onChange={e => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              )}

              {(selectedExercise.category === 'cardio' ||
               selectedExercise.category === 'flexibility') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                  {selectedExercise.category === 'cardio' && 
                   selectedExercise.name !== 'Natación' && 
                   selectedExercise.name !== 'Tenis' && (
                    <div className="space-y-2">
                      <Label htmlFor="distance">Distancia (km)</Label>
                      <Input
                        id="distance"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.distance}
                        onChange={e => setFormData(prev => ({ ...prev, distance: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedExercise.stepsPerKm && (
                <div className="space-y-2">
                  <Label htmlFor="steps">
                    Pasos {formData.steps && `(calculado: ${formData.steps})`}
                  </Label>
                  <Input
                    id="steps"
                    type="number"
                    min="0"
                    value={formData.steps}
                    onChange={e => setFormData(prev => ({ ...prev, steps: e.target.value }))}
                    placeholder="Número de pasos"
                  />
                </div>
              )}

              {calculatedCalories > 0 && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium text-muted-foreground">Calorías estimadas: {calculatedCalories} kcal</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Añade notas sobre el ejercicio..."
                />
              </div>

              <DialogFooter className="gap-3 sm:gap-0">
                <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 sm:flex-none">
                  {initialData ? 'Actualizar' : 'Guardar'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};