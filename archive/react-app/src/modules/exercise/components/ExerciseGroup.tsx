// src/modules/exercise/components/ExerciseGroup.tsx
import React from 'react';
import { Dumbbell, Activity } from 'lucide-react'; // Removed ChevronDown
import { Exercise } from '../models';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

interface ExerciseGroupProps {
  exercises: Exercise[];
  children: React.ReactNode;
  category: 'cardio' | 'strength' | 'flexibility' | 'balance';
}

const CATEGORY_CONFIG = {
  cardio: {
    icon: Activity,
    title: 'Cardio',
    description: 'Ejercicios cardiovasculares'
  },
  strength: {
    icon: Dumbbell,
    title: 'Fuerza',
    description: 'Ejercicios de fuerza y resistencia'
  },
  flexibility: {
    icon: Activity,
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
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <Accordion type="single" collapsible defaultValue={category} className="rounded-lg border border-gray-200">
      <AccordionItem value={category} className="border-b-0"> {/* Remove default bottom border from item if Accordion has border */}
        <AccordionTrigger className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted rounded-t-lg focus:outline-none focus:ring-2 focus:ring-ring data-[state=closed]:rounded-b-lg">
          {/* Added rounded-t-lg and conditional rounded-b-lg for when closed */}
          {/* hover:bg-muted instead of hover:bg-gray-50 */}
          {/* focus:ring-ring to use shadcn's ring color */}
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
          {/* ChevronDown is automatically added by AccordionTrigger and handles its own rotation */}
        </AccordionTrigger>
        <AccordionContent className="px-6 py-4">
          {/* Original padding was px-6 py-4 for the content when open */}
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};