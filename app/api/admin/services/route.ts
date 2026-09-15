import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type {
  CreateServiceInput,
  PriceUnit,
} from "@/lib/catalog/service-catalog.types";
import { createService, listServices } from "@/lib/catalog/services.service";

function toCreateInput(body: Record<string, unknown>): CreateServiceInput {
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
    return NextResponse.json({ service: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được mục giá. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
