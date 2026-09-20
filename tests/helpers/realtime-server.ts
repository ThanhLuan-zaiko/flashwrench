import { expect } from "bun:test";

// Buffered mailbox: WS frames can arrive before the test awaits them (the
// /publish HTTP response and the broadcast race), so every frame is queued
// and `next()` drains in order instead of dropping early arrivals.
export function mailbox(ws: WebSocket): { next: () => Promise<string> } {
  const queue: string[] = [];
  const waiters: Array<(value: string) => void> = [];
  ws.onmessage = (event) => {
    const text = String(event.data);
    const waiter = waiters.shift();
    if (waiter) waiter(text);
    else queue.push(text);
  };
  return {
    next: () =>
      new Promise<string>((resolve, reject) => {
        const queued = queue.shift();
        if (queued !== undefined) {
          resolve(queued);
          return;
        }
        const timer = setTimeout(() => reject(new Error("Timed out.")), 5000);
        waiters.push((value) => {
          clearTimeout(timer);
          resolve(value);
        });
      }),
  };
}

export async function openSocket(
  port: number,
  token?: string,
): Promise<WebSocket> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
    headers: token ? { Cookie: `fw_at=${token}` } : {},
  } as never);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out.")), 5000);
    ws.onopen = () => {
      clearTimeout(timer);
      resolve();
    };
    ws.onerror = () => reject(new Error("Connect failed."));
  });
  return ws;
}

export async function publishEvent(
  base: string,
  secret: string,
  topic: string,
  payload: unknown,
): Promise<Response> {
  return fetch(`${base}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-realtime-secret": secret,
    },
    body: JSON.stringify({ topic, payload }),
  });
}

export function wsClosed(ws: WebSocket): Promise<number> {
  return new Promise<number>((resolve) => {
    ws.addEventListener("close", (event) => resolve(event.code));
  });
}

export async function subscribeTopic(
  ws: WebSocket,
  box: { next: () => Promise<string> },
  topic: string,
): Promise<void> {
  ws.send(JSON.stringify({ type: "subscribe", topic }));
  expect(JSON.parse(await box.next())).toMatchObject({
    type: "subscribed",
    topic,
  });
}

export async function deniedSubscribe(
  ws: WebSocket,
  box: { next: () => Promise<string> },
  topic: string,
): Promise<void> {
  ws.send(JSON.stringify({ type: "subscribe", topic }));
  expect(JSON.parse(await box.next())).toMatchObject({ type: "error" });
}
