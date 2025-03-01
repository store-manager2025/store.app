// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { orders, orderIdCounter, Order } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, placeId, items } = body; // items: Array<{ menuId, quantity }>
    const newOrderId = orderIdCounter;
    const now = new Date().toISOString();
    // (가격 계산은 실제 서비스에서는 메뉴 가격 조회 후 계산해야 함)
    const totalPrice = 0;
    const newOrder: Order = {
      orderId: newOrderId,
      storeId,
      placeId,
      items,
      price: totalPrice,
      orderType: "UNPAID",
      orderStatus: "UNPAID",
      orderedAt: now,
      placeName: `테이블${placeId}`,
    };
    orders[newOrderId] = newOrder;
    // in‑memory counter 증가
    (global as any).orderIdCounter = newOrderId + 1;
    return NextResponse.json({
      message: "주문이 성공적으로 생성되었습니다.",
      orderId: newOrderId,
    });
  } catch (error) {
    return NextResponse.error();
  }
}
