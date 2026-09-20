import { NextResponse } from "next/server";
import { isTrustedOrigin } from "@/lib/auth/guards";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { isRecord } from "@/lib/validation";

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

export function mutationOriginError(request: Request): NextResponse | null {
  if (isTrustedOrigin(request)) return null;
  return NextResponse.json(
    { errors: { form: "Yêu cầu không hợp lệ (sai nguồn gốc)." } },
    { status: 403 },
  );
}

export function resultResponse<T>(
  result: WorkspaceResult<T>,
  shape: (data: T) => unknown,
  okStatus = 200,
): NextResponse {
  if (!result.ok) {
    return NextResponse.json(
      { errors: result.errors },
      { status: result.status },
    );
  }
  return NextResponse.json(shape(result.data), { status: okStatus });
}

export function routeFailure(form: string): NextResponse {
  return NextResponse.json({ errors: { form } }, { status: 500 });
}
