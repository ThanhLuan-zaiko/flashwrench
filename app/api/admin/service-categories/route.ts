import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type { CreateCategoryInput } from "@/lib/catalog/service-catalog.types";
import {
  createServiceCategory,
  listServiceCategories,
} from "@/lib/catalog/service-categories.service";

function toCreateInput(body: Record<string, unknown>): CreateCategoryInput {
  return {
    name: String(body.name ?? ""),
    slug: String(body.slug ?? ""),
    icon: body.icon === undefined ? undefined : String(body.icon),
    description:
      body.description === undefined ? undefined : String(body.description),
    sortOrder:
      body.sortOrder === undefined ? undefined : Number(body.sortOrder),
    isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
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
    return NextResponse.json({ category: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được loại hình. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
