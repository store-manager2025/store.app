// app/api/categories/all/[storeId]/route.ts
import { NextRequest, NextResponse } from "next/server";

// 백엔드 스프링 서버의 실제 API 주소
const BASE_URL = "http://localhost:8383/api/categories";

// GET /api/categories/all/[storeId]
export async function GET(
  request: NextRequest,
  // Next.js 동적 라우트에서 URL 파라미터를 받습니다
  { params }: { params: { storeId: string } }
) {
  const { storeId } = params;

  // 클라이언트(브라우저)에서 보낸 헤더 중 Authorization(토큰)을 꺼냅니다
  const authHeader = request.headers.get("Authorization");

  try {
    // 스프링 백엔드 API로 요청을 보냅니다
    const res = await fetch(`${BASE_URL}/all/${storeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 토큰이 있다면 그대로 전달
        Authorization: authHeader ?? "",
      },
    });

    // 백엔드 응답이 실패라면 에러 처리
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Fail to get categories for storeId=${storeId}`,
        },
        { status: res.status }
      );
    }

    // 성공 시 JSON 파싱 후 그대로 반환
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    // 요청 자체가 실패했을 경우 예외 처리
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
