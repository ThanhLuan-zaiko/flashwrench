import { describe, expect, test } from "bun:test";
import {
  type CrossTabBusDeps,
  createCrossTabBus,
} from "@/lib/cross-tab/cross-tab.bus";
import {
  CART_CHANGED_EVENT,
  CROSS_TAB_STORAGE_KEY,
  type CrossTabEvent,
  recordCreatedEvent,
} from "@/lib/cross-tab/cross-tab.protocol";

const ORDER_ID = "33333333-3333-4333-8333-333333333333";

type MessageHandler = (message: MessageEvent) => void;

// In-memory stand-in for BroadcastChannel: like the real API, a post reaches
// every OTHER channel object with the same name, never the sender itself.
function channelNetwork() {
  const members = new Set<{ handlers: Set<MessageHandler> }>();
  return () => {
    const self = { handlers: new Set<MessageHandler>() };
    members.add(self);
    return {
      postMessage(data: unknown) {
        for (const member of members) {
          if (member === self) continue;
          for (const handler of member.handlers) {
            handler({ data: structuredClone(data) } as MessageEvent);
          }
        }
      },
      addEventListener(_type: string, handler: MessageHandler) {
        self.handlers.add(handler);
      },
      removeEventListener(_type: string, handler: MessageHandler) {
        self.handlers.delete(handler);
      },
    } as unknown as ReturnType<CrossTabBusDeps["createChannel"]>;
  };
}

type StorageHandler = (event: StorageEvent) => void;

// Stand-in for windows sharing one localStorage: each call opens a window,
// and a write fires the `storage` event in every OTHER window, the way
// browsers do.
function storageNetwork(options?: { throwOnWrite?: boolean }) {
  const windows = new Set<{ handlers: Set<StorageHandler> }>();
  const data = new Map<string, string>();
  return () => {
    const self = { handlers: new Set<StorageHandler>() };
    windows.add(self);
    const fire = (key: string, newValue: string | null) => {
      for (const win of windows) {
        if (win === self) continue;
        for (const handler of win.handlers) {
          handler({ key, newValue } as StorageEvent);
        }
      }
    };
    const localStorage = {
      setItem(key: string, value: string) {
        if (options?.throwOnWrite) throw new Error("QuotaExceededError");
        data.set(key, value);
        fire(key, value);
      },
      removeItem(key: string) {
        data.delete(key);
        fire(key, null);
      },
    };
    return {
      localStorage,
      addEventListener(_type: string, handler: StorageHandler) {
        self.handlers.add(handler);
      },
      removeEventListener(_type: string, handler: StorageHandler) {
        self.handlers.delete(handler);
      },
    } as unknown as ReturnType<CrossTabBusDeps["target"]>;
  };
}

function collect(bus: ReturnType<typeof createCrossTabBus>) {
  const received: CrossTabEvent[] = [];
  const unsubscribe = bus.subscribe((event) => received.push(event));
  return { received, unsubscribe };
}

describe("createCrossTabBus over BroadcastChannel", () => {
  test("delivers to other tabs and never back to the sender", () => {
    const createChannel = channelNetwork();
    const target = () => null;
    const tabA = createCrossTabBus({ createChannel, target });
    const tabB = createCrossTabBus({ createChannel, target });
    const inA = collect(tabA);
    const inB = collect(tabB);

    const event = recordCreatedEvent("order", ORDER_ID);
    tabA.publish(event);

    expect(inB.received).toEqual([event]);
    expect(inA.received).toEqual([]);
  });

  test("stops delivering after unsubscribe", () => {
    const createChannel = channelNetwork();
    const target = () => null;
    const tabA = createCrossTabBus({ createChannel, target });
    const tabB = createCrossTabBus({ createChannel, target });
    const inB = collect(tabB);
    inB.unsubscribe();

    tabA.publish(CART_CHANGED_EVENT);
    expect(inB.received).toEqual([]);
  });

  test("drops malformed messages posted on the channel", () => {
    const createChannel = channelNetwork();
    const target = () => null;
    const tabB = createCrossTabBus({ createChannel, target });
    const inB = collect(tabB);
    const intruder = createChannel();
    intruder?.postMessage({ v: 1, kind: "record-created", recordId: "x" });
    expect(inB.received).toEqual([]);
  });
});

describe("createCrossTabBus storage fallback", () => {
  test("uses the storage event when BroadcastChannel is missing", () => {
    const openWindow = storageNetwork();
    const windowA = openWindow();
    const windowB = openWindow();
    const tabA = createCrossTabBus({
      createChannel: () => null,
      target: () => windowA,
    });
    const tabB = createCrossTabBus({
      createChannel: () => null,
      target: () => windowB,
    });
    const inA = collect(tabA);
    const inB = collect(tabB);

    tabA.publish(CART_CHANGED_EVENT);

    // The removal that follows the write must not count as a second event.
    expect(inB.received).toEqual([CART_CHANGED_EVENT]);
    expect(inA.received).toEqual([]);
  });

  test("ignores storage writes under other keys", () => {
    const openWindow = storageNetwork();
    const windowA = openWindow();
    const windowB = openWindow();
    const tabB = createCrossTabBus({
      createChannel: () => null,
      target: () => windowB,
    });
    const inB = collect(tabB);
    windowA?.localStorage.setItem("flashwrench-theme", "dark");
    windowA?.localStorage.setItem(CROSS_TAB_STORAGE_KEY, "{broken");
    expect(inB.received).toEqual([]);
  });

  test("swallows storage failures instead of throwing into a mutation", () => {
    const failingWindow = storageNetwork({ throwOnWrite: true })();
    const bus = createCrossTabBus({
      createChannel: () => null,
      target: () => failingWindow,
    });
    expect(() => bus.publish(CART_CHANGED_EVENT)).not.toThrow();
  });

  test("survives a channel constructor that throws", () => {
    const bus = createCrossTabBus({
      createChannel: () => {
        throw new Error("SecurityError");
      },
      target: () => null,
    });
    expect(() => bus.publish(CART_CHANGED_EVENT)).not.toThrow();
    expect(typeof bus.subscribe(() => undefined)).toBe("function");
  });
});
