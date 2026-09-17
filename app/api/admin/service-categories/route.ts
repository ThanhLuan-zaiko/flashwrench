import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type { CreateCategoryInput } from "@/lib/catalog/service-catalog.types";
import {
  createServiceCategory,
  listServiceCategories,
} from "@/lib/catalog/service-categories.service";
import { SERVICE_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function toCreateInput(body: Record<string, unknown>): CreateCategoryInput {
  return {
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    icon: body.icon === undefined ? undefined : String(body.icon),
    imageUrl: body.imageUrl === undefined ? undefined : String(body.imageUrl),
    imageAssetId:
      body.imageAssetId === undefined ? undefined : String(body.imageAssetId),
    images: toStringArray(body.images),
    imageAssetIds: toStringArray(body.imageAssetIds),
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

export async function GET(request: Request) {
  const { response } = await requireRole("admin");
  if (response) return response;
  const includeDeleted =
    new URL(request.url).searchParams.get("includeDeleted") === "true";
  try {
    const result = await listServiceCategories({ includeDeleted });
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ categories: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được loại hình. Vui lòng thử lại sau." } },
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
    const result = await createServiceCategory(
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
    return NextResponse.json({ category: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được loại hình. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
