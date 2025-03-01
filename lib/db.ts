// lib/db.ts
export interface OrderItem {
  menuId: number;
  quantity: number;
}

export interface Order {
  orderId: number;
  storeId: number;
  placeId: number;
  items: OrderItem[];
  price: number;
  orderType: string;
  orderStatus: string;
  orderedAt: string;
  placeName: string;
}

export let orders: Record<number, Order> = {};
export let orderIdCounter = 1;
