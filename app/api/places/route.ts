// app/api/places/route.ts
import { NextRequest, NextResponse } from "next/server";

// 스프링 서버에서 /api/places 로 매핑되었다고 가정
const BASE_URL = "http://localhost:8383/api/places";

/** 
 * POST /api/places
 * body 예시:
 * {
 *   "storeId": 12,
 *   "placeName": "Window 3",
 *   "uiId": 17,
 *   "positionX": 4,
 *   "positionY": 3
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // body: {storeId, placeName, uiId?, positionX?, positionY?}
    const body = await request.json();
    const res = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // 클라이언트에서 받은 body를 그대로 백엔드에 전달
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to create place" },
        { status: res.status }
      );
    }

    // 스프링 서버 응답
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/places - 좌석 수정
 * body 예시:
 * {
 *   "placeId": 1,
 *   "placeName": "창가1",
 *   "sizeType": "half",
 *   "positionX": 2,
 *   "positionY": 1
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // body: { placeId, placeName?, sizeType?, positionX?, positionY? }
    const body = await request.json();
    const res = await fetch(`${BASE_URL}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to update place" },
        { status: res.status }
      );
    }

    const data = await res.json(); // 예: { message: "성공적으로 수정되었습니다." }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
