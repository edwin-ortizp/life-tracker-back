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

export const DRINK_CATEGORIES = {
  water: 'Agua',
  dairy: 'Lácteos',
  caffeine: 'Cafeína',
  hydration: 'Hidratación',
  soda: 'Gaseosas',
  alcohol: 'Alcohol',
  other: 'Otros'
} as const;

export const DRINKS = {
  water: { 
    name: 'Agua', 
    icon: 'Droplet', 
    hydrationFactor: 1,
    color: 'text-blue-500',
    amounts: [100, 200, 300],
    category: 'water'
  },
  sparklingWater: {
    name: 'Agua con gas',
    icon: 'Waves',
    hydrationFactor: 1,
    color: 'text-blue-400',
    amounts: [100, 200, 300],
    category: 'water'
  },
  flavoredWater: {
    name: 'Agua saborizada',
    icon: 'Droplets',
    hydrationFactor: 0.95,
    color: 'text-blue-300',
    amounts: [100, 200, 300],
    category: 'water'
  },
  milk: { 
    name: 'Leche', 
    icon: 'Milk',
    hydrationFactor: 0.9,
    color: 'text-blue-500',
    amounts: [100, 200, 300],
    category: 'dairy'
  },
  chocolate: { 
    name: 'Chocolate', 
    icon: 'Milk',
    hydrationFactor: 0.8,
    color: 'text-brown-500',
    amounts: [100, 200, 300],
    category: 'dairy'
  },
  colagranulada: { 
    name: 'Cola Granulada', 
    icon: 'Milk',
    hydrationFactor: 0.9,
    color: 'text-red-500',
    amounts: [100, 200, 300],
    category: 'dairy'
  },
  ensure: { 
    name: 'Ensure / Pediasure', 
    icon: 'Milk',
    hydrationFactor: 0.9,
    color: 'text-red-500',
    amounts: [100, 200, 300],
    category: 'dairy'
  },
  yogurt: {
    name: 'Yogurt',
    icon: 'Milk',
    hydrationFactor: 0.6,
    color: 'text-amber-600',
    amounts: [100, 200, 300],
    category: 'dairy'
  },
  coffee: { 
    name: 'Café', 
    icon: 'Coffee', 
    hydrationFactor: 0.8,
    color: 'text-amber-800',
    amounts: [100, 200, 300],
    category: 'caffeine'
  },
  energyDrink: {
    name: 'Energizante',
    icon: 'Zap',
    hydrationFactor: 0.6,
    color: 'text-yellow-500',
    amounts: [100, 250, 500],
    category: 'caffeine'
  },  juice: {
    name: 'Jugo',
    icon: 'Cherry',
    hydrationFactor: 0.85,
    color: 'text-orange-500',
    amounts: [100, 200, 300],
    category: 'hydration'
  },
  sportsdrink: {
    name: 'Bebida deportiva',
    icon: 'Dumbbell',
    hydrationFactor: 0.9,
    color: 'text-green-500',
    amounts: [250, 500, 750],
    category: 'hydration'
  },  soup: {
    name: 'Sopa',
    icon: 'Soup',
    hydrationFactor: 0.6,
    color: 'text-orange-500',
    amounts: [200, 400, 600],
    category: 'other'
  },  soda: {
    name: 'Gaseosa',
    icon: 'CircleDot',
    hydrationFactor: 0.6,
    color: 'text-purple-500',
    amounts: [200, 350, 500],
    category: 'soda'
  },
  beer: {
    name: 'Cerveza',
    icon: 'Beer',
    hydrationFactor: 0.8,
    color: 'text-yellow-600',
    amounts: [330, 500, 750],
    category: 'alcohol'
  },  aguardiente: {
    name: 'Aguardiente',
    icon: 'Beer',
    hydrationFactor: 0.2,
    color: 'text-yellow-600',
    amounts: [50, 100, 200],
    category: 'alcohol'
  },
  wine: {
    name: 'Vino',
    icon: 'Wine',
    hydrationFactor: 0.1,
    color: 'text-red-600',
    amounts: [150, 250, 750],
    category: 'alcohol'
  },  aromatica: {
    name: 'Aromática',
    icon: 'Coffee',
    hydrationFactor: 0.95,
    color: 'text-green-600',
    amounts: [100, 200, 300],
    category: 'other'
  },iceCream: {
    name: 'Helado',
    icon: 'Cookie',
    hydrationFactor: 0.4,
    color: 'text-cyan-400',
    amounts: [50, 100, 150],
    category: 'other'
  },  granizado: {
    name: 'Granizado',
    icon: 'Cookie',
    hydrationFactor: 0.8,
    color: 'text-blue-300',
    amounts: [150, 250, 350],
    category: 'hydration'
  },
  tea: {
    name: 'Té',
    icon: 'Coffee',
    hydrationFactor: 0.9,
    color: 'text-green-500',
    amounts: [100, 200, 300],
    category: 'caffeine'
  }
} as const;