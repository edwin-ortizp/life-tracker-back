export const ITEM_STATUSES = ['in-stock', 'to-buy', 'low-stock'] as const;
export type ItemStatus = typeof ITEM_STATUSES[number];

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
  place?: string;
  status: ItemStatus;
}

export interface ShoppingListProps {}
