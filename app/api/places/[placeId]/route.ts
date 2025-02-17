// app/api/places/[placeId]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "http://localhost:8383/api/places";

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  const { placeId } = params;
  try {
    const res = await fetch(`${BASE_URL}/${placeId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to get place ${placeId}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** DELETE /api/places/[placeId] */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  const { placeId } = params;
  try {
    const res = await fetch(`${BASE_URL}/${placeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to delete placeId=${placeId}` },
        { status: res.status }
      );
    }
    const data = await res.json(); // {message: "..."}
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
