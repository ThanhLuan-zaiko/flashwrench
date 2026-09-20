import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  createPartCategory,
  listPartCategories,
} from "@/lib/parts/part-categories.service";
import type { CreatePartCategoryInput } from "@/lib/parts/parts.types";
import { PARTS_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

function notifyCatalogUpdated(): void {
  void publishRealtimeEvent(PARTS_CATALOG_TOPIC, {
    kind: "catalog-updated",
    updatedAt: new Date().toISOString(),
  });
}

function toCreateInput(body: Record<string, unknown>): CreatePartCategoryInput {
  return {
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    icon: body.icon === undefined ? undefined : String(body.icon),
    description:
      body.description === undefined ? undefined : String(body.description),
    sortOrder:
      body.sortOrder === undefined ? undefined : Number(body.sortOrder),
    isActive:
      body.isActive === undefined ? undefined : (body.isActive as boolean),
  };
}

export async function GET(request: Request) {
  const { response } = await requireRole("admin");
  if (response) return response;
  const params = new URL(request.url).searchParams;
  try {
    const result = await listPartCategories({
      includeDeleted: params.get("includeDeleted") === "true",
    });
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({ categories: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được danh mục. Vui lòng thử lại sau." } },
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
    const result = await createPartCategory(
      toCreateInput((body ?? {}) as Record<string, unknown>),
    );
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    notifyCatalogUpdated();
    return NextResponse.json({ category: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được danh mục. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
