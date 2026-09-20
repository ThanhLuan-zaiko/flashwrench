type FakeHandler = ((event?: unknown) => void) | null;

export class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  static instances: FakeWebSocket[] = [];

  readonly url: string;
  readyState = FakeWebSocket.CONNECTING;
  readonly sent: string[] = [];
  onopen: FakeHandler = null;
  onmessage: FakeHandler = null;
  onclose: FakeHandler = null;
  onerror: FakeHandler = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    if (this.readyState === FakeWebSocket.CLOSED) return;
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(data: unknown): void {
    this.onmessage?.({ data });
  }

  sentMessages(): Array<Record<string, unknown>> {
    return this.sent.map(
      (frame) => JSON.parse(frame) as Record<string, unknown>,
    );
  }

  static latest(): FakeWebSocket {
    const instance =
      FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
    if (!instance) throw new Error("No FakeWebSocket instance.");
    return instance;
  }

  static reset(): void {
    FakeWebSocket.instances = [];
  }
}

export function installBrowserFakes(): () => void {
  const holder = globalThis as Record<string, unknown>;
  const savedWindow = holder.window;
  const savedWebSocket = holder.WebSocket;
  holder.window = {
    location: { hostname: "unit.test", protocol: "http:" },
  };
  holder.WebSocket = FakeWebSocket;
  FakeWebSocket.reset();
  return () => {
    if (savedWindow === undefined) delete holder.window;
    else holder.window = savedWindow;
    if (savedWebSocket === undefined) delete holder.WebSocket;
    else holder.WebSocket = savedWebSocket;
    FakeWebSocket.reset();
  };
}
