import { describe, expect, jest, test } from "bun:test";
import {
  type RealtimeStatus,
  reconnectRealtime,
  subscribeRealtimeStatus,
  subscribeRealtimeTopic,
} from "@/lib/realtime/realtime-client";
import { FakeWebSocket, installBrowserFakes } from "../helpers/fake-websocket";

describe("shared realtime socket", () => {
  test("reference-counts topics on a single socket", () => {
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    try {
      unsubs.push(subscribeRealtimeTopic("service-catalog", () => {}));
      unsubs.push(subscribeRealtimeTopic("service-catalog", () => {}));
      unsubs.push(subscribeRealtimeTopic("mechanic-directory", () => {}));
      expect(FakeWebSocket.instances).toHaveLength(1);
      const ws = FakeWebSocket.latest();
      ws.open();
      const subscribed = ws
        .sentMessages()
        .filter((msg) => msg.type === "subscribe")
        .map((msg) => msg.topic)
        .sort();
      expect(subscribed).toEqual(["mechanic-directory", "service-catalog"]);

      unsubs[0]();
      expect(
        ws.sentMessages().filter((msg) => msg.type === "unsubscribe"),
      ).toHaveLength(0);
      unsubs[1]();
      expect(
        ws.sentMessages().filter((msg) => msg.type === "unsubscribe"),
      ).toEqual([{ type: "unsubscribe", topic: "service-catalog" }]);
      expect(ws.readyState).toBe(FakeWebSocket.OPEN);

      unsubs[2]();
      expect(ws.readyState).toBe(FakeWebSocket.CLOSED);
    } finally {
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
    }
  });

  test("keeps dispatching when a listener throws", () => {
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    const received: string[] = [];
    try {
      unsubs.push(
        subscribeRealtimeTopic("service-catalog", () => {
          throw new Error("listener boom");
        }),
        subscribeRealtimeTopic("service-catalog", () => {
          received.push("second");
        }),
      );
      const ws = FakeWebSocket.latest();
      ws.open();
      ws.receive(
        JSON.stringify({
          type: "event",
          topic: "service-catalog",
          payload: { kind: "catalog-updated" },
        }),
      );
      expect(received).toEqual(["second"]);
    } finally {
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
    }
  });

  test("fires ready only on the subscribed ack and again on re-ack", () => {
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    const readyCalls: string[] = [];
    try {
      unsubs.push(
        subscribeRealtimeTopic(
          "service-catalog",
          () => {},
          () => readyCalls.push("ready"),
        ),
      );
      const first = FakeWebSocket.latest();
      first.open();
      expect(readyCalls).toHaveLength(0);

      first.receive(
        JSON.stringify({ type: "subscribed", topic: "service-catalog" }),
      );
      expect(readyCalls).toEqual(["ready"]);

      reconnectRealtime();
      const second = FakeWebSocket.latest();
      second.open();
      expect(readyCalls).toHaveLength(1);

      second.receive(
        JSON.stringify({ type: "subscribed", topic: "service-catalog" }),
      );
      expect(readyCalls).toHaveLength(2);
    } finally {
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
    }
  });

  test("a late listener on an acknowledged topic is ready immediately", () => {
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    const readyCalls: string[] = [];
    try {
      unsubs.push(
        subscribeRealtimeTopic(
          "service-catalog",
          () => {},
          () => readyCalls.push("first"),
        ),
      );
      const ws = FakeWebSocket.latest();
      ws.open();
      ws.receive(
        JSON.stringify({ type: "subscribed", topic: "service-catalog" }),
      );

      unsubs.push(
        subscribeRealtimeTopic(
          "service-catalog",
          () => {},
          () => readyCalls.push("second"),
        ),
      );
      expect(readyCalls).toEqual(["first", "second"]);
      expect(
        ws.sentMessages().filter((msg) => msg.type === "subscribe"),
      ).toHaveLength(1);
    } finally {
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
    }
  });

  test("unsubscribing drops the ready callback for that listener", () => {
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    const firstReady: string[] = [];
    const secondReady: string[] = [];
    try {
      const unsubFirst = subscribeRealtimeTopic(
        "service-catalog",
        () => {},
        () => firstReady.push("r1"),
      );
      unsubs.push(unsubFirst);
      const ws = FakeWebSocket.latest();
      ws.open();
      ws.receive(
        JSON.stringify({ type: "subscribed", topic: "service-catalog" }),
      );
      unsubs.push(
        subscribeRealtimeTopic(
          "service-catalog",
          () => {},
          () => secondReady.push("r2"),
        ),
      );
      unsubFirst();
      expect(firstReady).toHaveLength(1);

      reconnectRealtime();
      const second = FakeWebSocket.latest();
      second.open();
      second.receive(
        JSON.stringify({ type: "subscribed", topic: "service-catalog" }),
      );
      expect(firstReady).toHaveLength(1);
      expect(secondReady).toEqual(["r2", "r2"]);
    } finally {
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
    }
  });

  test("a throwing status observer does not block the next one", () => {
    const seen: RealtimeStatus[] = [];
    const stopThrower = subscribeRealtimeStatus(() => {
      throw new Error("status boom");
    });
    const stopRecorder = subscribeRealtimeStatus((next) => seen.push(next));
    try {
      expect(seen).toEqual(["offline"]);
    } finally {
      stopThrower();
      stopRecorder();
    }
  });

  test("reports offline on denied frames instead of staying live", () => {
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    const statuses: RealtimeStatus[] = [];
    const warn = console.warn;
    console.warn = () => undefined;
    const stopStatus = subscribeRealtimeStatus((next) => statuses.push(next));
    try {
      unsubs.push(subscribeRealtimeTopic("user:u1", () => {}));
      const ws = FakeWebSocket.latest();
      ws.open();
      expect(statuses[statuses.length - 1]).toBe("live");
      ws.receive(JSON.stringify({ type: "error", message: "Forbidden." }));
      expect(statuses[statuses.length - 1]).toBe("offline");
    } finally {
      console.warn = warn;
      stopStatus();
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
    }
  });

  test("reconnectRealtime swaps the socket and resubscribes topics", () => {
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    try {
      unsubs.push(subscribeRealtimeTopic("service-catalog", () => {}));
      const first = FakeWebSocket.latest();
      first.open();
      const staleClose = first.onclose;

      reconnectRealtime();

      expect(FakeWebSocket.instances).toHaveLength(2);
      const second = FakeWebSocket.latest();
      expect(second).not.toBe(first);
      expect(first.readyState).toBe(FakeWebSocket.CLOSED);

      staleClose?.();
      expect(second.readyState).toBe(FakeWebSocket.CONNECTING);
      expect(FakeWebSocket.instances).toHaveLength(2);

      second.open();
      expect(
        second
          .sentMessages()
          .filter((msg) => msg.type === "subscribe")
          .map((msg) => msg.topic),
      ).toEqual(["service-catalog"]);
    } finally {
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
    }
  });

  test("guest socket is replaced by a fresh handshake after login", () => {
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    try {
      unsubs.push(subscribeRealtimeTopic("mechanic-directory", () => {}));
      const guestSocket = FakeWebSocket.latest();
      guestSocket.open();

      reconnectRealtime();

      const authedSocket = FakeWebSocket.latest();
      expect(FakeWebSocket.instances).toHaveLength(2);
      expect(guestSocket.readyState).toBe(FakeWebSocket.CLOSED);
      expect(authedSocket).not.toBe(guestSocket);
      authedSocket.open();
      expect(
        authedSocket
          .sentMessages()
          .filter((msg) => msg.type === "subscribe")
          .map((msg) => msg.topic),
      ).toEqual(["mechanic-directory"]);
    } finally {
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
    }
  });

  test("heartbeat pings, times out dead sockets, and cleans up", () => {
    jest.useFakeTimers();
    let now = 1_000_000;
    const realNow = Date.now;
    Date.now = () => now;
    const advance = (ms: number) => {
      now += ms;
      jest.advanceTimersByTime(ms);
    };
    const restore = installBrowserFakes();
    const unsubs: Array<() => void> = [];
    try {
      unsubs.push(subscribeRealtimeTopic("service-catalog", () => {}));
      const ws = FakeWebSocket.latest();
      ws.open();
      const pings = () =>
        ws.sentMessages().filter((msg) => msg.type === "ping").length;

      advance(25_000);
      expect(pings()).toBe(1);
      ws.receive(JSON.stringify({ type: "pong" }));
      advance(25_000);
      expect(pings()).toBe(2);

      advance(80_000);
      expect(ws.readyState).toBe(FakeWebSocket.CLOSED);

      advance(2_000);
      expect(FakeWebSocket.instances).toHaveLength(2);
      const revived = FakeWebSocket.latest();
      revived.open();

      for (const unsub of unsubs.splice(0)) unsub();
      const sentBefore = revived.sent.length;
      advance(120_000);
      expect(revived.readyState).toBe(FakeWebSocket.CLOSED);
      expect(revived.sent.length).toBe(sentBefore);
      expect(FakeWebSocket.instances).toHaveLength(2);
    } finally {
      for (const unsub of unsubs.splice(0)) unsub();
      restore();
      Date.now = realNow;
      jest.useRealTimers();
    }
  });
});
