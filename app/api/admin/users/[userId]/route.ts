import { NextResponse } from "next/server";
import {
  type AdminUserAction,
  applyAdminUserAction,
} from "@/lib/auth/admin-users.service";
import { requireRole } from "@/lib/auth/authorization";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { user, response } = await requireRole("admin");
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
  const action = (body as { action?: unknown }).action as AdminUserAction;

  try {
    const { userId } = await params;
    const result = await applyAdminUserAction(user.id, userId, action);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không cập nhật được tài khoản. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
