export const ITEM_STATUSES = ['in-stock', 'to-buy', 'low-stock'] as const;
export type ItemStatus = typeof ITEM_STATUSES[number];

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
  place?: string;
  consumeBy?: string; // Fecha de consumo preferente en formato ISO
  status: ItemStatus;
}

export interface ShoppingListProps {}
