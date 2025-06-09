export const CATEGORY_DATA = [
  { value: 'Aseo y Limpieza', emoji: '🧹' },
  { value: 'Bebidas', emoji: '🥤' },
  { value: 'Carnes y Pescados', emoji: '🥩' },
  { value: 'Cereales y Granos', emoji: '🌾' },
  { value: 'Condimentos y Especias', emoji: '🧂' },
  { value: 'Congelados', emoji: '❄️' },
  { value: 'Cuidado Personal', emoji: '🧴' },
  { value: 'Enlatados y Conservas', emoji: '🥫' },
  { value: 'Frutas y Verduras', emoji: '🍎' },
  { value: 'Lácteos y Huevos', emoji: '🥛' },
  { value: 'Panadería', emoji: '🍞' },
  { value: 'Snacks y Dulces', emoji: '🍪' },
  { value: 'Mascotas', emoji: '🐶' },
  { value: 'Otro', emoji: '📦' }
] as const;

export const CATEGORY_EMOJIS: Record<string, string> = CATEGORY_DATA.reduce((acc, c) => {
  acc[c.value] = c.emoji;
  return acc;
}, {} as Record<string, string>);

export const CATEGORIES = CATEGORY_DATA.map(c => c.value);

export const formatCategory = (cat?: string) => {
  if (!cat) return '';
  const emoji = CATEGORY_EMOJIS[cat];
  return emoji ? `${emoji} ${cat}` : cat;
};
