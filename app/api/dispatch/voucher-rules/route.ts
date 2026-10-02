import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  createAutoRule,
  listAutoRules,
} from "@/lib/vouchers/auto-rule.service";
import type { AutoTrigger } from "@/lib/vouchers/auto-rule.types";

export async function GET() {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  try {
    const result = await listAutoRules();
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ rules: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được quy tắc." } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireRole("dispatcher", "admin");
  if (response || !user) return response;
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
    const result = await createAutoRule(
      { id: user.id, role: user.role },
      {
        name: String(body.name ?? ""),
        campaignId: String(body.campaignId ?? ""),
        triggerType: body.triggerType as AutoTrigger,
        threshold:
          body.threshold === undefined ? undefined : Number(body.threshold),
        windowDays:
          body.windowDays === undefined ? undefined : Number(body.windowDays),
        isActive:
          body.isActive === undefined ? undefined : Boolean(body.isActive),
      },
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ rule: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được quy tắc. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
