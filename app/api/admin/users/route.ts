import { NextResponse } from "next/server";
import {
  type AdminRoleFilter,
  listAdminUsers,
} from "@/lib/auth/admin-users.service";
import { requireRole } from "@/lib/auth/authorization";
import type { UserStatus } from "@/lib/auth/user.types";

function parsePositiveInt(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const { user, response } = await requireRole("admin");
  if (response) return response;
  void user;

  const params = new URL(request.url).searchParams;
  try {
    const result = await listAdminUsers({
      role: (params.get("role") ?? "all") as AdminRoleFilter,
      status: (params.get("status") ?? undefined) as UserStatus | undefined,
      months: parsePositiveInt(params.get("months")),
      limit: parsePositiveInt(params.get("limit")),
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ users: result.users });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tải được danh sách người dùng. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
