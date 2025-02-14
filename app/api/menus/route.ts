import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "http://localhost:8383/api/menus"; // 백엔드 API 주소

// 새 메뉴  추가 (POST /api/menus)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get("authorization");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json",
        "Authorization": token,
       },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to create menus");
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 카테고리 수정 (PATCH /api/menus)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get("authorization");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const res = await fetch(BASE_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json",
        "Authorization": token,
       },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to update menus");
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 카테고리 삭제 (DELETE /api/menus/:id)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const menuId = searchParams.get("id");

    if (!menuId) {
      return NextResponse.json({ error: "Missing menu ID" }, { status: 400 });
    }

    const token = req.headers.get("authorization");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BASE_URL}/${menuId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json",
        "Authorization": token,
       },
    });

    if (!res.ok) throw new Error("Failed to delete menu");

    return NextResponse.json({ message: "menu deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
