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

type ServiceAction = "update" | "toggle-active" | "soft-delete" | "restore";

function toUpdateInput(body: Record<string, unknown>): UpdateServiceInput {
  return {
    categoryId: String(body.categoryId ?? ""),
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    description:
      body.description === undefined ? undefined : String(body.description),
    basePrice: Number(body.basePrice),
    priceUnit: String(body.priceUnit ?? "per_job") as PriceUnit,
    durationMin: Number(body.durationMin),
    isHomeSupported:
      body.isHomeSupported === undefined
        ? undefined
        : Boolean(body.isHomeSupported),
    isEmergencySupported:
      body.isEmergencySupported === undefined
        ? undefined
        : Boolean(body.isEmergencySupported),
    isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
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
      return NextResponse.json({ service: result.data });
    }
    if (action === "toggle-active") {
      const result = await toggleServiceActive(
        serviceId,
        Boolean(body.isActive),
      );
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      return NextResponse.json({ service: result.data });
    }
    if (action === "soft-delete") {
      const result = await softDeleteService(serviceId);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      return NextResponse.json({ service: result.data });
    }
    if (action === "restore") {
      const result = await restoreService(serviceId);
      if (!result.ok)
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
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
