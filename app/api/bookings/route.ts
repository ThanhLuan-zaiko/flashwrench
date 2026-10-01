import { NextResponse } from "next/server";
import { authenticateRequest, requireAuth } from "@/lib/auth/authorization";
import { setSessionCookies } from "@/lib/auth/cookies";
import { enforceRequestGuards } from "@/lib/auth/guards";
import {
  clearedGuestCookieOptions,
  GUEST_COOKIE,
  readGuestId,
} from "@/lib/auth/guest-session";
import { deviceLabel } from "@/lib/auth/user-sessions";
import { createCustomerBooking } from "@/lib/booking/booking.service";
import type {
  CreateBookingInput,
  CreatedBooking,
} from "@/lib/booking/booking.types";
import { createGuestBookingWithAccount } from "@/lib/booking/booking-signup.service";
import { listCustomerBookings } from "@/lib/booking/customer-booking.service";
import {
  mutationOriginError,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { notifyBookingCreated } from "@/lib/mail/confirmation.service";
import { mergeGuestCart } from "@/lib/orders/cart.service";
import { publishBookingChange } from "@/lib/realtime/domain-publish";

// Signal only: subscribers refetch the real rows over HTTPS. A
// preselected mechanic gets the job in their personal inbox, so their
// queue updates without a reload; unassigned jobs stay on the booking
// topic for the future dispatcher board.
function publishNewBooking(booking: CreatedBooking, actorId: string | null) {
  void publishBookingChange(
    "booking-created",
    booking.bookingId,
    booking.status,
    actorId,
    [booking.mechanicId],
  );
  if (booking.mechanicId) {
    void publishBookingChange(
      "booking-assigned",
      booking.bookingId,
      booking.status,
      actorId,
      [booking.mechanicId],
    );
  }
}

// Customer booking creation. Thin handler: parse input, call the service,
// shape the response, then fan the new-booking signal out over the
// gateway. Never CQL or business logic here.
export async function GET(request: Request) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await listCustomerBookings(user.id, {
      cursor: url.searchParams.get("cursor"),
      limit: url.searchParams.get("limit") ?? undefined,
      search: url.searchParams.get("q") ?? undefined,
    });
    return resultResponse(result, (page) => ({
      items: page.items,
      nextCursor: page.nextCursor,
    }));
  } catch {
    return routeFailure(
      "Không tải được danh sách đơn hàng. Vui lòng thử lại sau.",
    );
  }
}

// Public booking intake. Guests need no session — they leave the
// contact trio (name/phone/email) plus the service address, and the row
// stores customer_id null like a public rescue request. A logged-in
// caller keeps the account link so the booking shows in their history.
// With `createAccount`, the same submit also registers the guest — the
// contact trio doubles as the account identity and the booking lands on
// the fresh account directly.
export async function POST(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const user = await authenticateRequest();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  const input = body as CreateBookingInput;
  const wantsAccount = user === null && input.createAccount === true;
  if (wantsAccount) {
    // This request doubles as a registration, so it borrows the register
    // bucket's stricter rate limit on top of the CSRF origin check above.
    const blocked = await enforceRequestGuards(request, "register");
    if (blocked) return blocked;
  }

  try {
    if (wantsAccount) {
      const signup = await createGuestBookingWithAccount(
        input,
        deviceLabel(request.headers.get("user-agent")),
      );
      if (!signup.ok) {
        return NextResponse.json(
          { errors: signup.errors },
          { status: signup.status },
        );
      }
      const { booking, user: newUser, tokens } = signup.data;
      publishNewBooking(booking, newUser.id);
      notifyBookingCreated(booking, newUser.email, newUser.fullName);
      // Same guest-cart handoff as register: what the shopper already
      // picked follows them into the new account.
      const guestId = await readGuestId();
      if (guestId) {
        try {
          await mergeGuestCart(guestId, newUser.id);
        } catch {
          // Best effort only.
        }
      }
      const response = NextResponse.json(
        { booking, user: newUser },
        { status: 201 },
      );
      setSessionCookies(response, tokens);
      if (guestId) {
        response.cookies.set(GUEST_COOKIE, "", clearedGuestCookieOptions());
      }
      return response;
    }

    const result = await createCustomerBooking(user, {
      serviceId: input.serviceId ?? "",
      scheduledAt: input.scheduledAt ?? "",
      timeZone: input.timeZone,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      address: input.address ?? "",
      province: input.province,
      district: input.district,
      ward: input.ward,
      street: input.street,
      lat: input.lat,
      lng: input.lng,
      mechanicId: input.mechanicId,
      vehicleId: input.vehicleId,
      vehiclePlate: input.vehiclePlate ?? "",
      vehicleBrand: input.vehicleBrand,
      vehicleModel: input.vehicleModel,
      notes: input.notes,
      walletId: input.walletId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    const booking = result.data;
    publishNewBooking(booking, user?.id ?? null);
    // Courtesy copy of the tracking link: fire-and-forget so an SMTP
    // outage can never fail a booking that already persisted.
    notifyBookingCreated(
      booking,
      user?.email ?? input.email,
      user?.fullName ?? input.fullName,
    );
    return NextResponse.json({ booking }, { status: 201 });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tạo được lịch hẹn. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
