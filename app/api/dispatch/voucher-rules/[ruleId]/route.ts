import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { toggleAutoRule } from "@/lib/vouchers/auto-rule.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  const { user, response } = await requireRole("dispatcher", "admin");
  if (response || !user) return response;
  const { ruleId } = await params;
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
    const result = await toggleAutoRule(
      { id: user.id, role: user.role },
      ruleId,
      Boolean(body.isActive),
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ rule: result.data });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không đổi được trạng thái quy tắc." } },
      { status: 500 },
    );
  }
}
