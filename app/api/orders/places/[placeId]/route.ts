// app/api/orders/places/[placeId]/route.ts
import { NextResponse } from "next/server";
import { orders } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  const placeId = parseInt(params.placeId, 10);
  const order = Object.values(orders).find(
    (o) => o.placeId === placeId && o.orderStatus === "UNPAID"
  );
  if (!order) {
    return NextResponse.json({ error: "No unpaid order" }, { status: 404 });
  }
  const menuDetail = order.items.map((item) => ({
    menuName: `메뉴${item.menuId}`,
    discountRate: 0,
    totalPrice: 10000 * item.quantity,
    totalCount: item.quantity,
    menuId: item.menuId,
  }));
  const response = {
    orderId: order.orderId,
    storeId: order.storeId,
    placeId: order.placeId,
    price: order.price,
    orderStatus: order.orderStatus,
    orderedAt: order.orderedAt,
    placeName: order.placeName,
    menuDetail,
  };
  return NextResponse.json(response);
}
