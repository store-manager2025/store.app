// app/api/places/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "http://localhost:8383/api/places";

/** POST /api/places - 새 좌석 생성 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // {storeId, placeName}
    const res = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to create place" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** PATCH /api/places - 좌석 수정 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json(); // {placeId, placeName, sizeType}
    const res = await fetch(`${BASE_URL}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to update place" }, { status: res.status });
    }
    const data = await res.json(); // {message: "..."}
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
