import { NextResponse } from "next/server";
import { getPublicPartBySlug } from "@/lib/parts/public-parts.service";

// Public product detail for /products/[slug]. Guests can read it; hidden
// or trashed rows return 404 like a missing product.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const result = await getPublicPartBySlug(slug);
    if (!result.ok) {
      return NextResponse.json(
        {
          errors: {
            form:
              result.status === 404
                ? "Sản phẩm không tồn tại hoặc đã ngừng bán."
                : "Không tải được sản phẩm. Vui lòng thử lại sau.",
          },
        },
        { status: result.status },
      );
    }
    return NextResponse.json({ part: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được sản phẩm. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
