// src/features/exercise/types/index.ts

export interface Exercise {
    id: number;
    name: string;
    icon: string;
    category: 'cardio' | 'strength' | 'flexibility';
    targetMuscles: string[];
    defaultSets?: number;
    defaultReps?: number;
    defaultDuration?: number; // en minutos
    defaultDistance?: number; // en metros
    caloriesPerHour?: number; // calorías quemadas por hora
    description?: string; // descripción del ejercicio
    stepsPerKm?: number; // pasos promedio por kilómetro
}

export interface ExerciseLog {
    id: string;
    exerciseId: number;
    date: string;
    sets?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    weight?: number;
    calories?: number;
    steps?: number;
    notes?: string;
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

export const EXERCISES: Exercise[] = [
    {
        id: 1,
        name: 'Pasos',
        icon: '👣',
        category: 'cardio',
        targetMuscles: ['piernas'],
        caloriesPerHour: 200,
        description: 'Registro de pasos diarios',
        stepsPerKm: 1312 // Aproximadamente 1312 pasos por km (promedio)
    },
    {
        id: 2,
        name: 'Trotar',
        icon: '🏃',
        category: 'cardio',
        targetMuscles: ['piernas', 'core'],
        defaultDuration: 30,
        caloriesPerHour: 500,
        description: 'Trote suave a ritmo constante',
        stepsPerKm: 1200
    },
    {
        id: 3,
        name: 'Bicicleta',
        icon: '🚲',
        category: 'cardio',
        targetMuscles: ['piernas', 'core'],
        defaultDuration: 45,
        defaultDistance: 10000,
        caloriesPerHour: 450,
        description: 'Ciclismo recreativo'
    },
    {
        id: 4,
        name: 'Caminata',
        icon: '🚶',
        category: 'cardio',
        targetMuscles: ['piernas'],
        defaultDuration: 30,
        caloriesPerHour: 250,
        description: 'Caminata a paso moderado',
        stepsPerKm: 1400
    },
    {
        id: 5,
        name: 'Natación',
        icon: '🏊',
        category: 'cardio',
        targetMuscles: ['todo el cuerpo'],
        defaultDuration: 30,
        caloriesPerHour: 550,
        description: 'Natación estilo libre'
    },
    {
        id: 6,
        name: 'Tenis',
        icon: '🎾',
        category: 'cardio',
        targetMuscles: ['todo el cuerpo'],
        defaultDuration: 60,
        caloriesPerHour: 500,
        description: 'Partido recreativo de tenis'
    },
    // Ejercicios de fuerza
    {
        id: 7,
        name: 'Abdominales',
        icon: '💪',
        category: 'strength',
        targetMuscles: ['abdominales', 'core'],
        defaultSets: 3,
        defaultReps: 15,
        caloriesPerHour: 300,
        description: 'Series de abdominales básicos'
    },
    {
        id: 8,
        name: 'Pesas de mano',
        icon: '🏋️',
        category: 'strength',
        targetMuscles: ['brazos', 'hombros'],
        defaultSets: 3,
        defaultReps: 12,
        caloriesPerHour: 250,
        description: 'Ejercicios con mancuernas ligeras'
    },
    {
        id: 9,
        name: 'Flexiones',
        icon: '💪',
        category: 'strength',
        targetMuscles: ['pecho', 'tríceps', 'hombros'],
        defaultSets: 3,
        defaultReps: 10,
        caloriesPerHour: 350,
        description: 'Flexiones de pecho (pushups)'
    },
    {
        id: 10,
        name: 'Sentadillas',
        icon: '🏋️',
        category: 'strength',
        targetMuscles: ['cuádriceps', 'glúteos', 'core'],
        defaultSets: 3,
        defaultReps: 12,
        caloriesPerHour: 400,
        description: 'Sentadillas sin peso adicional'
    },
    {
        id: 11,
        name: 'Burpees',
        icon: '💥',
        category: 'strength',
        targetMuscles: ['todo el cuerpo'],
        defaultSets: 3,
        defaultReps: 15,
        caloriesPerHour: 700,
        description: 'Ejercicio completo de cardio y fuerza'
    },
    // Ejercicios de flexibilidad
    {
        id: 12,
        name: 'Yoga',
        icon: '🧘',
        category: 'flexibility',
        targetMuscles: ['todo el cuerpo'],
        defaultDuration: 20,
        caloriesPerHour: 250,
        description: 'Rutina básica de yoga'
    },
    {
        id: 13,
        name: 'Estiramientos',
        icon: '🤸',
        category: 'flexibility',
        targetMuscles: ['todo el cuerpo'],
        defaultDuration: 15,
        caloriesPerHour: 150,
        description: 'Rutina de estiramientos generales'
    }
] as const;

export const EXERCISE_COLORS: Record<string, string> = {
    cardio: 'bg-red-500',
    strength: 'bg-blue-500',
    flexibility: 'bg-green-500'
} as const;