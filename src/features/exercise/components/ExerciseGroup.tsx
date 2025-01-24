// src/features/exercise/components/ExerciseGroup.tsx
import React from 'react';
import { ChevronDown, Dumbbell, Activity, Running, Yoga } from 'lucide-react';
import { Exercise } from '../types';

interface ExerciseGroupProps {
  exercises: Exercise[];
  children: React.ReactNode;
  category: 'cardio' | 'strength' | 'flexibility' | 'balance';
}

const CATEGORY_CONFIG = {
  cardio: {
    icon: Running,
    title: 'Cardio',
    description: 'Ejercicios cardiovasculares'
  },
  strength: {
    icon: Dumbbell,
    title: 'Fuerza',
    description: 'Ejercicios de fuerza y resistencia'
  },
  flexibility: {
    icon: Yoga,
    title: 'Flexibilidad',
    description: 'Ejercicios de estiramiento y movilidad'
  },
  balance: {
    icon: Activity,
    title: 'Equilibrio',
    description: 'Ejercicios de estabilidad y balance'
  }
};

export const ExerciseGroup: React.FC<ExerciseGroupProps> = ({
  exercises,
  children,
  category
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        <div className="flex items-center gap-4">
          <Icon className="w-5 h-5" />
          <div>
            <h3 className="font-medium">{config.title}</h3>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
          <div className="ml-4">
            <span className="text-sm text-gray-500">
              {exercises.length} ejercicios
            </span>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isOpen ? 'px-6 py-4' : 'max-h-0'
        }`}
      >
        {isOpen && children}
      </div>
    </div>
  );
};