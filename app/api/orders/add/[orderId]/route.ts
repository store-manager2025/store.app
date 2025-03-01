// app/api/orders/add/[orderId]/route.ts
import { NextResponse } from "next/server";
import { orders } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const orderId = parseInt(params.orderId, 10);
  if (!orders[orderId]) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { items } = body; // items: Array<{ menuId, quantity }>
    orders[orderId].items = orders[orderId].items.concat(items);
    return NextResponse.json({ message: "주문추가가 완료되었습니다." });
  } catch (error) {
    return NextResponse.error();
  }
}
