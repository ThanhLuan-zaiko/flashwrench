import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import {
  listThreadMessages,
  sendChatMessage,
} from "@/lib/chat/chat-messages.service";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { threadId } = await context.params;
  try {
    const rawLimit = request.nextUrl.searchParams.get("limit");
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
    const result = await listThreadMessages(user, threadId, {
      cursor: request.nextUrl.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được tin nhắn. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;
  const { threadId } = await context.params;
  let body: { body?: unknown };
  try {
    body = (await request.json()) as { body?: unknown };
  } catch {
    body = {};
  }
  if (typeof body.body !== "string") {
    return NextResponse.json(
      { errors: { body: "Nội dung tin nhắn không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await sendChatMessage(user, threadId, body.body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không gửi được tin nhắn. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
