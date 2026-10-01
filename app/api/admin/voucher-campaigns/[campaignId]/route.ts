import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import type {
  UpdateCampaignInput,
  VoucherDiscountType,
  VoucherScope,
} from "@/lib/vouchers/voucher.types";
import {
  toggleCampaign,
  updateCampaign,
} from "@/lib/vouchers/voucher-campaign.service";
import { publishCampaignChange } from "@/lib/vouchers/voucher-realtime";

function toInput(body: Record<string, unknown>): UpdateCampaignInput {
  return {
    code: String(body.code ?? ""),
    name: String(body.name ?? ""),
    description: body.description === undefined ? "" : String(body.description),
    imageUrl: body.imageUrl === undefined ? "" : String(body.imageUrl),
    imageAssetId:
      body.imageAssetId === undefined ? undefined : String(body.imageAssetId),
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const { user, response } = await requireRole("admin");
  if (response || !user) return response;
  const { campaignId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = ((await request.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    if (body.action === "toggle" && typeof body.isActive === "boolean") {
      const toggled = await toggleCampaign(campaignId, body.isActive);
      if (!toggled.ok) {
        return NextResponse.json(
          { errors: toggled.errors },
          { status: toggled.status },
        );
      }
      void publishCampaignChange(campaignId);
      return NextResponse.json({ campaign: toggled.data });
    }
    const result = await updateCampaign(campaignId, toInput(body));
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishCampaignChange(campaignId);
    return NextResponse.json({ campaign: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không cập nhật được chiến dịch." } },
      { status: 500 },
    );
  }
}
