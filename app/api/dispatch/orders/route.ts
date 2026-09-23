import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { createCounterSale } from "@/lib/orders/counter-sale.service";
import { listStaffOrders } from "@/lib/orders/orders.service";
import type { CounterSaleInput } from "@/lib/orders/orders.types";
import { OPERATIONS_TOPIC } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

// Dispatch order board feed: one status partition of one month bucket,
// paged via the signed cursor. Dispatcher and admin share this list.
export async function GET(request: Request) {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await listStaffOrders({
      status: url.searchParams.get("status") ?? "pending",
      month: url.searchParams.get("month") ?? undefined,
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    return NextResponse.json({
      items: result.data.items,
      nextCursor: result.data.nextCursor,
    });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được danh sách đơn. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}

function toCounterSaleInput(body: Record<string, unknown>): CounterSaleInput {
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  return {
    customerName:
      body.customerName === undefined ? undefined : String(body.customerName),
    customerPhone:
      body.customerPhone === undefined ? undefined : String(body.customerPhone),
    note: body.note === undefined ? undefined : String(body.note),
    lines: rawLines.map((line) => ({
      partId: (line as Record<string, unknown>)?.partId,
      quantity: (line as Record<string, unknown>)?.quantity,
    })) as CounterSaleInput["lines"],
  };
}

// Walk-in counter sale: dispatcher/admin records a workshop purchase;
// the order is born delivered + paid and stock is decremented like a
// normal checkout.
export async function POST(request: Request) {
  const { user, response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const origin = mutationOriginError(request);
  if (origin) return origin;
  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await createCounterSale(user.id, toCounterSaleInput(body));
    if (!result.ok)
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    void publishRealtimeEvent(OPERATIONS_TOPIC, {
      kind: "orders-updated",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ order: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tạo được đơn bán tại quầy. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
