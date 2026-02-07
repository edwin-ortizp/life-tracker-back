// src/modules/exercise/types/index.ts

export interface Exercise {
    id: number;
    name: string;
    icon: string;
    category: 'cardio' | 'strength' | 'flexibility';
    targetMuscles: string[];
    defaultSets?: number;
    defaultReps?: number;
    defaultDuration?: number;
    defaultDistance?: number;
    caloriesPerHour?: number;
    description?: string;
    stepsPerKm?: number;
}

export interface ExerciseLog {
    exerciseId: string; // Changed from number to string (UUID) for exercise_type_id
    sets?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    weight?: number;
    calories?: number;
    steps?: number;
    notes?: string;
}

// Nueva interfaz para el documento en Firebase
export interface ExerciseDocument {
    userId: string;
    date: string;
    exercises: ExerciseLog[];
    summary: ExerciseSummary;
    createdAt: any; // Firebase Timestamp
    updatedAt: any; // Firebase Timestamp
}

export interface ExerciseSummary {
    totalCalories: number;
    totalSteps: number;
    totalDuration: number;
    totalDistance: number;
    categoryStats: {
        [key in 'cardio' | 'strength' | 'flexibility']: {
            count: number;
            duration: number;
            calories: number;
        }
    };
}

export interface ExerciseProps {
    selectedDate: Date;
}

// Agrupación de ejercicios por categoría para el modal
export const EXERCISE_CATEGORIES = {
    cardio: {
        name: 'Cardio',
        description: 'Ejercicios cardiovasculares',
        icon: '❤️'
    },
    strength: {
        name: 'Fuerza',
        description: 'Ejercicios de fuerza y resistencia',
        icon: '💪'
    },
    flexibility: {
        name: 'Flexibilidad',
        description: 'Ejercicios de estiramiento',
        icon: '🤸'
    }
} as const;

export const EXERCISE_COLORS: Record<string, string> = {
    cardio: 'bg-red-500',
    strength: 'bg-blue-500',
    flexibility: 'bg-green-500'
} as const;