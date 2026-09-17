import { NextResponse } from "next/server";
import {
  type AdminRoleFilter,
  listAdminUsers,
} from "@/lib/auth/admin-users.service";
import { requireRole } from "@/lib/auth/authorization";
import { createStaff } from "@/lib/auth/staff.service";
import type { UserRole, UserStatus } from "@/lib/auth/user.types";
import { STAFF_PASSWORDS_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

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

// Create one staff account (customer, mechanic or dispatcher). The server
// generates a one-time temp password returned once in the response.
export async function POST(request: Request) {
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
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const input = body as {
    fullName?: unknown;
    phone?: unknown;
    email?: unknown;
    role?: unknown;
    avatarAssetId?: string | null;
  };

  try {
    const result = await createStaff(user.id, {
      fullName: String(input.fullName ?? ""),
      phone: String(input.phone ?? ""),
      email: String(input.email ?? ""),
      role: input.role as UserRole,
      avatarAssetId: input.avatarAssetId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    void publishRealtimeEvent(STAFF_PASSWORDS_TOPIC, {
      kind: "created",
      userId: result.user.id,
    });
    return NextResponse.json(
      { user: result.user, tempPassword: result.tempPassword },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không tạo được tài khoản. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
