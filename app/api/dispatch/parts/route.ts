import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { listParts } from "@/lib/parts/parts.service";

// Stock board feed: the live (non-deleted) parts list for dispatchers,
// who adjust quantities but never edit catalog fields.
export async function GET() {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  try {
    const result = await listParts();
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ parts: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được tồn kho. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
