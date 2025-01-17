// src/features/water/types/index.ts
export interface Drink {
    type: keyof typeof DRINKS;
    amount: number;
    hydration: number;
    timestamp: string;
    time: string;
  }
  
  export interface WaterProps {
    selectedDate: Date;
  }
  
  export const DRINKS = {
    water: { 
      name: 'Agua', 
      icon: 'Droplet', 
      hydrationFactor: 1,
      color: 'text-blue-500',
      amounts: [100, 200, 300]
    },
    milk: { 
      name: 'Leche', 
      icon: 'Glasses',
      hydrationFactor: 0.9,
      color: 'text-gray-500',
      amounts: [100, 200, 300]
    },
    tea: {
      name: 'Té',
      icon: 'Coffee',
      hydrationFactor: 0.85,
      color: 'text-amber-600',
      amounts: [100, 200, 300]
    },
    coffee: { 
      name: 'Café', 
      icon: 'Coffee', 
      hydrationFactor: 0.8,
      color: 'text-amber-800',
      amounts: [100, 200, 300]
    },
    juice: {
      name: 'Jugo',
      icon: 'Glasses',
      hydrationFactor: 0.85,
      color: 'text-orange-500',
      amounts: [100, 200, 300]
    }
  } as const;