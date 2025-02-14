// app/api/menus/all/[categoryId]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "http://localhost:8383/api/menus";

export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { categoryId } = params;
  const authHeader = request.headers.get("Authorization") ?? "";

  try {
    const res = await fetch(`${BASE_URL}/all/${categoryId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch menus" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
