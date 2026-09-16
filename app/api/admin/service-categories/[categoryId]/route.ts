import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type { UpdateCategoryInput } from "@/lib/catalog/service-catalog.types";
import {
  hardDeleteCategoryWithConfirm,
  restoreCategory,
  softDeleteCategory,
  toggleCategoryActive,
  updateServiceCategory,
} from "@/lib/catalog/service-categories.service";
import { SERVICE_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

type CategoryAction = "update" | "toggle-active" | "soft-delete" | "restore";

function notifyCatalogUpdated(): void {
  void publishRealtimeEvent(SERVICE_CATALOG_TOPIC, {
    kind: "catalog-updated",
    updatedAt: new Date().toISOString(),
  });
}

function toUpdateInput(body: Record<string, unknown>): UpdateCategoryInput {
  return {
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    icon: body.icon === undefined ? undefined : String(body.icon),
    imageUrl: body.imageUrl === undefined ? undefined : String(body.imageUrl),
    imageAssetId:
      body.imageAssetId === undefined ? undefined : String(body.imageAssetId),
    description:
      body.description === undefined ? undefined : String(body.description),
    sortOrder:
      body.sortOrder === undefined ? undefined : Number(body.sortOrder),
    // Strict passthrough (no Boolean() coercion): non-boolean values
    // reach validateCategoryInput and fail with 400 instead of flipping
    // truthy strings like "false" into true.
    isActive:
      body.isActive === undefined ? undefined : (body.isActive as boolean),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
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
  const action = body.action as CategoryAction;
  try {
    const { categoryId } = await params;
    if (action === "update") {
      const result = await updateServiceCategory(
        categoryId,
        toUpdateInput(body),
      );
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ category: result.data });
    }
    if (action === "toggle-active") {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { errors: { isActive: "Trạng thái không hợp lệ." } },
          { status: 400 },
        );
      }
      const result = await toggleCategoryActive(categoryId, body.isActive);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ category: result.data });
    }
    if (action === "soft-delete") {
      const result = await softDeleteCategory(categoryId);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ category: result.data });
    }
    if (action === "restore") {
      const result = await restoreCategory(categoryId);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ category: result.data });
    }
    return NextResponse.json(
      { errors: { form: "Hành động không hợp lệ." } },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không cập nhật được loại hình. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}

// Hard delete is permanent. The client must send { confirm: slug } after
// the type-to-confirm dialog; the service re-validates it server-side.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
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
    const { categoryId } = await params;
    const result = await hardDeleteCategoryWithConfirm(
      categoryId,
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
          form: "Không xóa vĩnh viễn được loại hình. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
