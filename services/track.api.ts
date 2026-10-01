import type { PublicBookingTracking } from "@/lib/booking/booking.types";
import type { PublicOrderTracking } from "@/lib/orders/orders.types";

export type { PublicBookingTracking, PublicOrderTracking };

export class TrackApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TrackApiError";
    this.status = status;
  }
}

// Public tracking fetchers: no session cookie needed — the unguessable
// id in the URL is the capability. Plain fetch, no auth refresh retry.
async function fetchTracking<T>(path: string): Promise<{ tracking: T }> {
  const response = await fetch(path);
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    const errors = body.errors as Record<string, string> | undefined;
    throw new TrackApiError(
      response.status,
      errors?.form ?? "Không tải được tiến trình. Vui lòng thử lại.",
    );
  }
  return body as { tracking: T };
}

export function fetchBookingTracking(
  bookingId: string,
): Promise<{ tracking: PublicBookingTracking }> {
  return fetchTracking<PublicBookingTracking>(
    `/api/track/booking/${encodeURIComponent(bookingId)}`,
  );
}

export function fetchOrderTracking(
  orderId: string,
): Promise<{ tracking: PublicOrderTracking }> {
  return fetchTracking<PublicOrderTracking>(
    `/api/track/order/${encodeURIComponent(orderId)}`,
  );
}
