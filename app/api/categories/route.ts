import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "http://localhost:8383/api/categories"; // 백엔드 API 주소

// 모든 카테고리 조회 (GET /api/categories)
export async function GET() {
  try {
    const res = await fetch(`${BASE_URL}/all/1`, { method: "GET" }); // storeId=1 예시
    if (!res.ok) throw new Error("Failed to fetch categories");

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 새 카테고리 추가 (POST /api/categories)
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

    if (!res.ok) throw new Error("Failed to create category");
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 카테고리 수정 (PATCH /api/categories)
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

    if (!res.ok) throw new Error("Failed to update category");
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 카테고리 삭제 (DELETE /api/categories/:id)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("id");

    if (!categoryId) {
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
    }

    const token = req.headers.get("authorization");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BASE_URL}/${categoryId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json",
        "Authorization": token,
       },
    });

    if (!res.ok) throw new Error("Failed to delete category");

    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
