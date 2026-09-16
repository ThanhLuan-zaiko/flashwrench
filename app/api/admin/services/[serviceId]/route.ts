import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type {
  PriceUnit,
  UpdateServiceInput,
} from "@/lib/catalog/service-catalog.types";
import {
  hardDeleteServiceWithConfirm,
  restoreService,
  softDeleteService,
  toggleServiceActive,
  updateService,
} from "@/lib/catalog/services.service";
import { SERVICE_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

type ServiceAction = "update" | "toggle-active" | "soft-delete" | "restore";

function notifyCatalogUpdated(): void {
  void publishRealtimeEvent(SERVICE_CATALOG_TOPIC, {
    kind: "catalog-updated",
    updatedAt: new Date().toISOString(),
  });
}

function toUpdateInput(body: Record<string, unknown>): UpdateServiceInput {
  return {
    categoryId: String(body.categoryId ?? ""),
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    imageUrl: body.imageUrl === undefined ? undefined : String(body.imageUrl),
    imageAssetId:
      body.imageAssetId === undefined ? undefined : String(body.imageAssetId),
    description:
      body.description === undefined ? undefined : String(body.description),
    basePrice: Number(body.basePrice),
    priceUnit: String(body.priceUnit ?? "per_job") as PriceUnit,
    durationMin: Number(body.durationMin),
    // Strict passthrough (no Boolean() coercion): non-boolean values
    // reach validateServiceInput and fail with 400 instead of flipping
    // truthy strings like "false" into true.
    isHomeSupported:
      body.isHomeSupported === undefined
        ? undefined
        : (body.isHomeSupported as boolean),
    isEmergencySupported:
      body.isEmergencySupported === undefined
        ? undefined
        : (body.isEmergencySupported as boolean),
    isActive:
      body.isActive === undefined ? undefined : (body.isActive as boolean),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> },
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
  const action = body.action as ServiceAction;
  try {
    const { serviceId } = await params;
    if (action === "update") {
      const result = await updateService(serviceId, toUpdateInput(body));
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ service: result.data });
    }
    if (action === "toggle-active") {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { errors: { isActive: "Trạng thái không hợp lệ." } },
          { status: 400 },
        );
      }
      const result = await toggleServiceActive(serviceId, body.isActive);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ service: result.data });
    }
    if (action === "soft-delete") {
      const result = await softDeleteService(serviceId);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ service: result.data });
    }
    if (action === "restore") {
      const result = await restoreService(serviceId);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      notifyCatalogUpdated();
      return NextResponse.json({ service: result.data });
    }
    return NextResponse.json(
      { errors: { form: "Hành động không hợp lệ." } },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không cập nhật được mục giá. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}

// Hard delete is permanent. The client must send { confirm: slug } after
// the type-to-confirm dialog; the service re-validates it server-side.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> },
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
    const { serviceId } = await params;
    const result = await hardDeleteServiceWithConfirm(
      serviceId,
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
          form: "Không xóa vĩnh viễn được mục giá. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
