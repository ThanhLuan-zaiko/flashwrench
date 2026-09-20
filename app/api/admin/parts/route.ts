import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { createPart, listParts } from "@/lib/parts/parts.service";
import { PARTS_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { toPartInput } from "./part-input";

export async function GET(request: Request) {
  const { response } = await requireRole("admin");
  if (response) return response;
  const params = new URL(request.url).searchParams;
  try {
    const result = await listParts({
      includeDeleted: params.get("includeDeleted") === "true",
      categoryId: params.get("categoryId") ?? undefined,
    });
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ parts: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được sản phẩm. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireRole("admin");
  if (response) return response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await createPart(
      toPartInput((body ?? {}) as Record<string, unknown>),
    );
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishRealtimeEvent(PARTS_CATALOG_TOPIC, {
      kind: "catalog-updated",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ part: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được sản phẩm. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
