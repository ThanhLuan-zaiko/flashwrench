import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { adjustPartStock } from "@/lib/parts/parts-lifecycle.service";
import { PARTS_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

// Staff stock adjustment: { action: "set-stock", stockQty } writes an
// absolute quantity. Catalog fields stay admin-only on /api/admin/parts.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partId: string }> },
) {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  if (body.action !== "set-stock") {
    return NextResponse.json(
      { errors: { form: "Hành động không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const { partId } = await params;
    const result = await adjustPartStock(partId, Number(body.stockQty));
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishRealtimeEvent(PARTS_CATALOG_TOPIC, {
      kind: "catalog-updated",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ part: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không cập nhật được tồn kho. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}
