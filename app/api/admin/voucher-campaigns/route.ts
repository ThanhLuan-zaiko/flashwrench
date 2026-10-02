import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type {
  CreateCampaignInput,
  VoucherDiscountType,
  VoucherScope,
} from "@/lib/vouchers/voucher.types";
import {
  createCampaign,
  listCampaigns,
} from "@/lib/vouchers/voucher-campaign.service";
import { publishCampaignChange } from "@/lib/vouchers/voucher-realtime";

function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function toInput(body: Record<string, unknown>): CreateCampaignInput {
  return {
    slug: String(body.slug ?? ""),
    name: String(body.name ?? ""),
    description: body.description === undefined ? "" : String(body.description),
    images: toStringList(body.images),
    imageAssetIds: toStringList(body.imageAssetIds),
    discountType: String(body.discountType ?? "fixed") as VoucherDiscountType,
    discountValue: Number(body.discountValue),
    maxDiscount: body.maxDiscount === undefined ? 0 : Number(body.maxDiscount),
    minOrder: body.minOrder === undefined ? 0 : Number(body.minOrder),
    scope: String(body.scope ?? "all") as VoucherScope,
    startAt: body.startAt === undefined ? undefined : String(body.startAt),
    endAt: body.endAt === undefined ? undefined : String(body.endAt),
    totalLimit: body.totalLimit === undefined ? 0 : Number(body.totalLimit),
    perUserLimit:
      body.perUserLimit === undefined ? 1 : Number(body.perUserLimit),
    allowDispatcherGrant:
      body.allowDispatcherGrant === undefined
        ? false
        : (body.allowDispatcherGrant as boolean),
    dispatcherMaxValue:
      body.dispatcherMaxValue === undefined
        ? 0
        : Number(body.dispatcherMaxValue),
    isActive: body.isActive === undefined ? true : (body.isActive as boolean),
  };
}

export async function GET() {
  const { user, response } = await requireRole("admin");
  if (response || !user) return response;
  try {
    const result = await listCampaigns({ includeDeleted: true });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ campaigns: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được chiến dịch. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireRole("admin");
  if (response || !user) return response;
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
    const result = await createCampaign(
      user.id,
      toInput((body ?? {}) as Record<string, unknown>),
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishCampaignChange(result.data.id);
    return NextResponse.json({ campaign: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được chiến dịch. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
