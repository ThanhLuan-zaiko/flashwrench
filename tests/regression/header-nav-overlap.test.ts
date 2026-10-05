import { describe, expect, mock, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { authKeys } from "@/hooks/auth";

mock.module("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push() {},
    replace() {},
    refresh() {},
    back() {},
    forward() {},
    prefetch() {},
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// The logo's static-import props do not exist in the test bundle, so
// next/image falls back to a plain <img> render.
mock.module("next/image", () => ({
  default: ({ priority: _priority, ...props }: Record<string, unknown>) =>
    createElement("img", props),
}));

const { SiteHeader } = await import("@/components/layout/SiteHeader");

// Regression for the header overlap at 1024–1180px: the inline nav
// links could not shrink, so they slid under the cart/theme/login
// controls between lg and ~1170px. The nav now starts at xl and every
// narrower viewport gets the menu button + mobile menu instead — the
// switch has to happen at one shared breakpoint or the gap reopens.

function renderHeader() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(authKeys.me, { user: null, status: "active" });
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        ToastProvider,
        null,
        createElement(
          SiteHeader as (props: { currentPath: string }) => ReactElement,
          {
            currentPath: "/",
          },
        ),
      ),
    ),
  );
  queryClient.clear();
  return markup;
}

describe("header nav overlap", () => {
  test("the inline nav and the menu button switch at xl only", () => {
    const markup = renderHeader();
    expect(markup).toMatch(
      /class="[^"]*xl:flex[^"]*"[^>]*>\s*<nav aria-label="Điều hướng chính"/,
    );
    expect(markup).toMatch(
      /<nav aria-label="Điều hướng chính" class="[^"]*xl:block[^"]*"/,
    );
    expect(markup).toMatch(
      /aria-controls="mobile-menu"[^>]*class="[^"]*xl:hidden[^"]*"|class="[^"]*xl:hidden[^"]*"[^>]*aria-controls="mobile-menu"/,
    );
    expect(markup).toMatch(/id="mobile-menu"[^>]*class="[^"]*xl:hidden[^"]*"/);
    expect(markup).not.toContain("lg:flex");
    expect(markup).not.toContain("lg:block");
    expect(markup).not.toContain("lg:hidden");
  });
});
