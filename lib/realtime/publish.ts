// Server-side helper for Next.js route handlers: forward one event to the
// realtime gateway, which fans it out to subscribed browser clients.
// Best-effort with a short timeout so a down gateway never breaks the API,
// but failures are logged: a silent gateway means no realtime updates.
import { resolvePublishSecret } from "./protocol";

export async function publishRealtimeEvent(
  topic: string,
  payload: unknown,
): Promise<void> {
  const url =
    process.env.REALTIME_PUBLISH_URL ?? "http://127.0.0.1:3001/publish";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-realtime-secret": resolvePublishSecret(),
      },
      body: JSON.stringify({ topic, payload }),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) {
      console.warn(`[realtime] publish to ${topic} failed: ${response.status}`);
    }
  } catch (error) {
    console.warn(
      `[realtime] gateway unreachable: ${(error as Error)?.message}`,
    );
  }
}
