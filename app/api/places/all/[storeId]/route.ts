// app/api/places/all/[storeId]/route.ts
import { NextRequest, NextResponse } from "next/server";

// 실제 백엔드 주소 (스프링 등)
const BASE_URL = "http://localhost:8383/api/places";

export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const { storeId } = params;
  try {
    // GET /api/places/all/{storeId}
    const res = await fetch(`${BASE_URL}/all/${storeId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch places for storeId=${storeId}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
