// app/api/orders/detail/[orderId]/route.ts
import { NextResponse } from "next/server";
import { orders } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const orderId = parseInt(params.orderId, 10);
  const order = orders[orderId];
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  // 메뉴 상세 정보를 변환 (실제 서비스에서는 메뉴 정보를 별도로 조회)
  const menuDetail = order.items.map((item) => ({
    menuName: `메뉴${item.menuId}`,
    discountRate: 0,
    totalPrice: 10000 * item.quantity, // 예시: 단가 10,000원
    totalCount: item.quantity,
    menuId: item.menuId,
  }));
  const response = {
    orderId: order.orderId,
    storeId: order.storeId,
    placeId: order.placeId,
    price: order.price,
    orderType: order.orderType,
    orderStatus: order.orderStatus,
    orderedAt: order.orderedAt,
    placeName: order.placeName,
    menuDetail,
  };
  return NextResponse.json(response);
}
