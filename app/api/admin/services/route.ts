import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type {
  CreateServiceInput,
  PriceUnit,
} from "@/lib/catalog/service-catalog.types";
import { createService, listServices } from "@/lib/catalog/services.service";
import { SERVICE_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function toCreateInput(body: Record<string, unknown>): CreateServiceInput {
  return {
    categoryId: String(body.categoryId ?? ""),
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    imageUrl: body.imageUrl === undefined ? undefined : String(body.imageUrl),
    imageAssetId:
      body.imageAssetId === undefined ? undefined : String(body.imageAssetId),
    images: toStringArray(body.images),
    imageAssetIds: toStringArray(body.imageAssetIds),
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

export async function GET(request: Request) {
  const { response } = await requireRole("admin");
  if (response) return response;
  const params = new URL(request.url).searchParams;
  try {
    const result = await listServices({
      includeDeleted: params.get("includeDeleted") === "true",
      categoryId: params.get("categoryId") ?? undefined,
    });
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ services: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được bảng giá. Vui lòng thử lại sau." } },
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
    const result = await createService(
      toCreateInput((body ?? {}) as Record<string, unknown>),
    );
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishRealtimeEvent(SERVICE_CATALOG_TOPIC, {
      kind: "catalog-updated",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ service: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được mục giá. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
