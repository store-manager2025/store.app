import { NextRequest, NextResponse } from "next/server";
import axiosInstance from "@/lib/axiosInstance";

/** 결제 관련 API 라우트 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await axiosInstance.post("/api/pay", body); // 실제 API 호출
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("결제 생성 오류:", error);
    return NextResponse.json({ error: "결제 처리 실패" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { pathname } = new URL(req.url);
  try {
    if (pathname.startsWith("/api/pay/all/")) {
      const storeId = pathname.split("/").pop();
      const response = await axiosInstance.get(`/api/pay/all/${storeId}`);
      return NextResponse.json(response.data, { status: 200 });
    } else if (pathname.includes("/api/pay/detail")) {
      const url = new URL(req.url);
      const paymentId = url.searchParams.get("paymentId");
      const response = await axiosInstance.get(`/api/pay/detail?paymentId=${paymentId}`);
      return NextResponse.json(response.data, { status: 200 });
    }
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  } catch (error) {
    console.error("결제 조회 오류:", error);
    return NextResponse.json({ error: "데이터 가져오기 실패" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const paymentId = pathname.split("/").pop();
  try {
    const body = await req.json();
    const response = await axiosInstance.patch(`/api/pay/${paymentId}`, body);
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("결제 업데이트 오류:", error);
    return NextResponse.json({ error: "결제 업데이트 실패" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const paymentId = pathname.split("/").pop();
  try {
    const response = await axiosInstance.delete(`/api/pay/${paymentId}`);
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("결제 삭제 오류:", error);
    return NextResponse.json({ error: "결제 삭제 실패" }, { status: 500 });
  }
}