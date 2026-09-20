import { NextResponse } from "next/server";
import { listPublicParts } from "@/lib/parts/public-parts.service";

// Public parts catalog for the /products shop page. No login required so
// guests can browse; only active, non-deleted rows are returned.
export async function GET() {
  try {
    const result = await listPublicParts();
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({
      categories: result.data.categories,
      parts: result.data.parts,
    });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được danh sách sản phẩm. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
