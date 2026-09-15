import { NextResponse } from "next/server";
import {
  type AdminUserAction,
  applyAdminUserAction,
} from "@/lib/auth/admin-users.service";
import { requireRole } from "@/lib/auth/authorization";
import {
  hardDeleteStaff,
  restoreStaff,
  softDeleteStaff,
  updateStaff,
} from "@/lib/auth/staff.service";
import type { UserRole } from "@/lib/auth/user.types";

type StaffAction = "update" | "soft" | "restore";

function isStaffAction(value: unknown): value is StaffAction {
  return value === "update" || value === "soft" || value === "restore";
}

async function parseBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { user, response } = await requireRole("admin");
  if (response) return response;

  const body = await parseBody(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const action = (body as { action?: unknown }).action;
  const { userId } = await params;

  try {
    if (isStaffAction(action)) {
      if (action === "soft") {
        const result = await softDeleteStaff(user.id, userId);
        if (!result.ok) {
          return NextResponse.json(
            { errors: result.errors },
            { status: result.status },
          );
        }
        return NextResponse.json({ user: result.user });
      }
      if (action === "restore") {
        const result = await restoreStaff(user.id, userId);
        if (!result.ok) {
          return NextResponse.json(
            { errors: result.errors },
            { status: result.status },
          );
        }
        return NextResponse.json({ user: result.user });
      }
      const input = body as {
        fullName?: unknown;
        phone?: unknown;
        email?: unknown;
        role?: unknown;
      };
      const result = await updateStaff(user.id, userId, {
        fullName: String(input.fullName ?? ""),
        phone: String(input.phone ?? ""),
        email: String(input.email ?? ""),
        role: input.role as UserRole,
      });
      if (!result.ok) {
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      }
      return NextResponse.json({ user: result.user });
    }

    const result = await applyAdminUserAction(
      user.id,
      userId,
      action as AdminUserAction,
    );
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

// Hard delete a trashed account. The body must carry the account phone
// number as confirmation, mirroring the slug-typing guard for catalog.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { user, response } = await requireRole("admin");
  if (response) return response;

  const body = await parseBody(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const confirm = String((body as { confirm?: unknown }).confirm ?? "");
  const { userId } = await params;

  try {
    const result = await hardDeleteStaff(user.id, userId, confirm);
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
          form: "Không xóa được tài khoản. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
