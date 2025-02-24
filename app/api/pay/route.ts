// app/api/pay/route.ts
import { NextResponse } from "next/server";
import axiosInstance from "@/lib/axiosInstance";

export async function POST(request: Request) {
  const paymentData = await request.json();
  try {
    const response = await axiosInstance.post("/api/pay", paymentData);
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
