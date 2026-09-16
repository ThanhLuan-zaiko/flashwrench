import { NextResponse } from "next/server";
import { listPublicCatalog } from "@/lib/catalog/public-catalog.service";

// Public catalog for the /services landing page. No login required so
// guests can browse prices; only active, non-deleted rows are returned.
export async function GET() {
  try {
    const result = await listPublicCatalog();
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({
      categories: result.data.categories,
      services: result.data.services,
    });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được danh sách dịch vụ. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
