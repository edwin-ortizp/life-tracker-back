// Utilidad para limpiar objetos de valores undefined y null
export const cleanFirestoreData = (obj: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      // Si es string, verificar que no esté vacío
      if (typeof value === 'string' && value.trim() === '') {
        continue;
      }
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

// Utilidad específica para datos de shopping items
export const cleanShoppingItemData = (item: any) => {
  const cleaned: any = {
    name: item.name,
    quantity: Number(item.quantity),
    status: item.status
  };
  
  if (item.price !== undefined && item.price !== null && item.price !== '') {
    cleaned.price = Number(item.price);
  }
  
  if (item.category && item.category.trim() !== '') {
    cleaned.category = item.category.trim();
  }
  
  if (item.place && item.place.trim() !== '') {
    cleaned.place = item.place.trim();
  }
  
  return cleaned;
};
