import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { updatePart } from "@/lib/parts/parts.service";
import {
  hardDeletePartWithConfirm,
  restorePart,
  softDeletePart,
  togglePartActive,
} from "@/lib/parts/parts-lifecycle.service";
import { PARTS_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { toPartInput } from "../part-input";

type PartAction = "update" | "toggle-active" | "soft-delete" | "restore";

function notifyCatalogUpdated(): void {
  void publishRealtimeEvent(PARTS_CATALOG_TOPIC, {
    kind: "catalog-updated",
    updatedAt: new Date().toISOString(),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partId: string }> },
) {
  const { response } = await requireRole("admin");
  if (response) return response;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const action = body.action as PartAction;
  try {
    const { partId } = await params;
    if (action === "update") {
      const result = await updatePart(partId, toPartInput(body));
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ part: result.data });
    }
    if (action === "toggle-active") {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { errors: { isActive: "Trạng thái không hợp lệ." } },
          { status: 400 },
        );
      }
      const result = await togglePartActive(partId, body.isActive);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ part: result.data });
    }
    if (action === "soft-delete") {
      const result = await softDeletePart(partId);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ part: result.data });
    }
    if (action === "restore") {
      const result = await restorePart(partId);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ part: result.data });
    }
    return NextResponse.json(
      { errors: { form: "Hành động không hợp lệ." } },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không cập nhật được sản phẩm. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}

// Hard delete is permanent. The client must send { confirm: slug } after
// the type-to-confirm dialog; the service re-validates it server-side.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ partId: string }> },
) {
  const { response } = await requireRole("admin");
  if (response) return response;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  try {
    const { partId } = await params;
    const result = await hardDeletePartWithConfirm(
      partId,
      String(body.confirm ?? ""),
    );
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    notifyCatalogUpdated();
    return NextResponse.json({ deleted: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không xóa vĩnh viễn được sản phẩm. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
