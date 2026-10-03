// Guardrails for the floating chat overlay: the panel must render above the
// sticky site header (z-50, h-16) with its own header fully visible, and the
// launcher must stay above page content on every viewport. Pure module, so
// no mocks are needed anywhere in this file.
import { describe, expect, test } from "bun:test";
import {
  CHAT_FAB_CLASSES,
  CHAT_PANEL_CLASSES,
} from "@/components/chat/chat-overlay.classes";

describe("CHAT_PANEL_CLASSES", () => {
  test("anchors to the viewport above the launcher", () => {
    for (const token of [
      "fixed",
      "bottom-24",
      "right-4",
      "sm:right-5",
      "flex",
      "flex-col",
    ]) {
      expect(CHAT_PANEL_CLASSES).toContain(token);
    }
  });

  test("stacks above the sticky site header", () => {
    expect(CHAT_PANEL_CLASSES).toContain("z-[60]");
    expect(CHAT_PANEL_CLASSES).not.toContain("z-50");
  });

  test("reserves header height so its own header stays visible", () => {
    expect(CHAT_PANEL_CLASSES).toContain("h-[min(560px,calc(100dvh-11rem))]");
  });

  test("stays within small viewports", () => {
    expect(CHAT_PANEL_CLASSES).toContain("w-[min(400px,calc(100vw-2rem))]");
  });
});

describe("CHAT_FAB_CLASSES", () => {
  test("floats above page content and the header", () => {
    for (const token of ["fixed", "bottom-5", "right-5", "z-[60]"]) {
      expect(CHAT_FAB_CLASSES).toContain(token);
    }
  });
});
