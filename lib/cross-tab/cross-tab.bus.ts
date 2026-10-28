// Same-browser transport for CrossTabEvent. BroadcastChannel first; browsers
// without it fall back to the `storage` event, which every OTHER tab of the
// origin receives when one tab writes localStorage. Both paths skip the
// sending tab by design: a channel object never hears its own posts, and a
// tab never receives the storage event for its own write. Every browser API
// access is best-effort — a blocked storage or a missing API means "no
// sync", never an exception in a mutation callback.
import {
  CROSS_TAB_CHANNEL,
  CROSS_TAB_STORAGE_KEY,
  type CrossTabEvent,
  parseCrossTabEvent,
  parseStoredCrossTabEvent,
} from "./cross-tab.protocol";

export type CrossTabListener = (event: CrossTabEvent) => void;

type ChannelLike = Pick<
  BroadcastChannel,
  "postMessage" | "addEventListener" | "removeEventListener"
>;

type StorageTarget = Pick<
  Window,
  "localStorage" | "addEventListener" | "removeEventListener"
>;

export type CrossTabBusDeps = {
  createChannel: () => ChannelLike | null;
  target: () => StorageTarget | null;
};

export type CrossTabBus = {
  publish: (event: CrossTabEvent) => void;
  subscribe: (listener: CrossTabListener) => () => void;
};

export function createCrossTabBus(deps: CrossTabBusDeps): CrossTabBus {
  // One channel object per bus, shared by publish and subscribe, so this
  // tab never receives what it posted itself.
  let channel: ChannelLike | null | undefined;
  function getChannel(): ChannelLike | null {
    if (channel === undefined) {
      try {
        channel = deps.createChannel();
      } catch {
        channel = null;
      }
    }
    return channel;
  }

  function publish(event: CrossTabEvent): void {
    try {
      const open = getChannel();
      if (open) {
        open.postMessage(event);
        return;
      }
      const storage = deps.target()?.localStorage;
      if (!storage) return;
      // The nonce makes repeated identical events still count as a change.
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      storage.setItem(CROSS_TAB_STORAGE_KEY, JSON.stringify({ event, nonce }));
      storage.removeItem(CROSS_TAB_STORAGE_KEY);
    } catch {
      // Sync is a convenience; the next focus refetch still catches up.
    }
  }

  function subscribe(listener: CrossTabListener): () => void {
    const open = getChannel();
    if (open) {
      const onMessage = (message: MessageEvent) => {
        const event = parseCrossTabEvent(message.data);
        if (event) listener(event);
      };
      open.addEventListener("message", onMessage);
      return () => open.removeEventListener("message", onMessage);
    }
    const target = deps.target();
    if (!target) return () => undefined;
    const onStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key !== CROSS_TAB_STORAGE_KEY) return;
      const event = parseStoredCrossTabEvent(storageEvent.newValue);
      if (event) listener(event);
    };
    target.addEventListener("storage", onStorage);
    return () => target.removeEventListener("storage", onStorage);
  }

  return { publish, subscribe };
}

function browserBus(): CrossTabBus {
  return createCrossTabBus({
    createChannel: () =>
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(CROSS_TAB_CHANNEL),
    target: () => (typeof window === "undefined" ? null : window),
  });
}

// Lazily created on first use so server rendering never touches browser APIs.
let sharedBus: CrossTabBus | null = null;

function getSharedBus(): CrossTabBus | null {
  if (typeof window === "undefined") return null;
  sharedBus ??= browserBus();
  return sharedBus;
}

export function publishCrossTabEvent(event: CrossTabEvent): void {
  getSharedBus()?.publish(event);
}

export function subscribeCrossTabEvents(
  listener: CrossTabListener,
): () => void {
  return getSharedBus()?.subscribe(listener) ?? (() => undefined);
}
