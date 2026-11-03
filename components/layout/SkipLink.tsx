"use client";

// First Tab stop on every page. Jumps over the header and nav straight to
// the page's main landmark, so keyboard and screen reader users skip the
// repeated chrome on each navigation.
export function SkipLink() {
  return (
    // biome-ignore lint/a11y/useValidAnchor: a real hash link that also moves focus to <main>
    <a
      href="#main-content"
      onClick={(event) => {
        const main = document.querySelector<HTMLElement>("main");
        if (!main) return;
        event.preventDefault();
        main.tabIndex = -1;
        main.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-zinc-900 focus:ring-2 focus:ring-zinc-500 dark:focus:bg-zinc-950 dark:focus:text-zinc-50"
    >
      Chuyển đến nội dung chính
    </a>
  );
}
