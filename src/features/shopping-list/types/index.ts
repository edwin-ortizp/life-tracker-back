export const ITEM_STATUSES = ['in-stock', 'to-buy', 'low-stock'] as const;
export type ItemStatus = typeof ITEM_STATUSES[number];
export const ITEM_UNITS = ['units', 'grams', 'milliliters'] as const;
export type ItemUnit = typeof ITEM_UNITS[number];

export interface ShoppingItem {
  id: string;
  name: string;
  stock: number;
  toBuy: number;
  price?: number | null;
  category?: string;
  place?: string;
  consumeBy?: string; // Fecha de consumo preferente en formato ISO
  status: ItemStatus;
  nextPurchase?: boolean;
  unit?: ItemUnit;
  barcode?: string;
}

export interface ShoppingListProps {}
