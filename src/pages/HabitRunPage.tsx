import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { HABITS } from '@/features/habit/types';
import { useHabitDataDaily } from '@/features/habit/hooks/useHabitDataDaily';
import { getLocalDateString } from '@/utils/dates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const getRandomBackground = (habitId: number) => {
  const backgrounds = [
    'bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900',
    'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900',
    'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900',
    'bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900',
    'bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900',
    'bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900',
    'bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900',
    'bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900',
    'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900',
    'bg-gradient-to-br from-green-900 via-emerald-900 to-slate-900',
  ];
  
  return backgrounds[habitId % backgrounds.length];
};

export default function HabitRunPage() {
  const { habitId } = useParams<{ habitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const date = new Date(location.state?.date || new Date());
  
  const { completedHabits, toggleHabit } = useHabitDataDaily(date);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  
  const habit = HABITS.find(h => h.id === Number(habitId));
  const dateStr = getLocalDateString(date);
  const habitKey = `${habitId}_${dateStr}`;
  const isHabitCompleted = completedHabits[habitKey] || false;
  
  const backgroundClass = useMemo(() => 
    getRandomBackground(Number(habitId)), 
    [habitId]
  );

  if (!habit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Hábito no encontrado</h1>
          <Button onClick={() => navigate(-1)} variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const steps = habit.steps || [];
  const totalSteps = steps.length;

  useEffect(() => {
    if (completedSteps.length === 0) {
      setCompletedSteps(new Array(totalSteps).fill(false));
    }
  }, [completedSteps.length, totalSteps]);

  const handleStepToggle = (stepIndex: number) => {
    const newCompletedSteps = [...completedSteps];
    newCompletedSteps[stepIndex] = !newCompletedSteps[stepIndex];
    setCompletedSteps(newCompletedSteps);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteHabit = async () => {
    try {
      await toggleHabit(Number(habitId), dateStr);
      navigate(-1);
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const completedStepsCount = completedSteps.filter(Boolean).length;
  const progressPercentage = totalSteps > 0 ? (completedStepsCount / totalSteps) * 100 : 0;

  return (
    <div className={`min-h-screen flex flex-col ${backgroundClass} text-white`}>
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/20 text-lg font-semibold drop-shadow-lg px-6 py-3" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <div className="text-right">
            <div className="text-sm text-white/80">Progreso</div>
            <div className="text-2xl font-bold drop-shadow-lg">
              {completedStepsCount}/{totalSteps}
            </div>
          </div>
        </div>

        {/* Habit Title */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{habit.icon}</div>
          <h1 className="text-4xl font-bold drop-shadow-xl mb-2">{habit.name}</h1>
          <p className="text-xl text-white/80 drop-shadow-lg">{habit.goal}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-center mt-2 text-white/80">
            {progressPercentage.toFixed(0)}% completado
          </div>
        </div>

        {/* Current Step */}
        {totalSteps > 0 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="text-lg text-white/80 mb-2">
                Paso {currentStep + 1} de {totalSteps}
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 mx-auto max-w-2xl">
                <div className="flex items-center justify-center mb-6">
                  <Checkbox
                    checked={completedSteps[currentStep] || false}
                    onCheckedChange={() => handleStepToggle(currentStep)}
                    className="scale-150 mr-4"
                  />
                  <h2 className="text-2xl font-semibold drop-shadow-lg">
                    {steps[currentStep]}
                  </h2>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mb-8">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 text-lg font-semibold backdrop-blur-sm disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Anterior
              </Button>
              
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentStep
                        ? 'bg-white scale-125'
                        : completedSteps[index]
                        ? 'bg-green-400'
                        : 'bg-white/30'
                    }`}
                    title={`Ir al paso ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={currentStep === totalSteps - 1}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 text-lg font-semibold backdrop-blur-sm disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Complete Habit Button */}
        <div className="mt-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-xl font-semibold shadow-xl drop-shadow-lg border border-green-500"
              >
                <CheckCircle className="w-6 h-6 mr-3" />
                {isHabitCompleted ? 'Hábito Completado' : 'Completar Hábito'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isHabitCompleted ? 'Desmarcar Hábito' : 'Completar Hábito'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isHabitCompleted 
                    ? '¿Estás seguro de que quieres desmarcar este hábito como completado?'
                    : '¿Estás seguro de que quieres marcar este hábito como completado?'
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCompleteHabit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isHabitCompleted ? 'Sí, desmarcar' : 'Sí, completar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}