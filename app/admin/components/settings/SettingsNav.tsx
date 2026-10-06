import { SETTINGS_SECTIONS } from "./settings-sections";

// Jump links to the settings sections below. Plain anchors — no JS — so
// they keep working before hydration and stay accessible.
export function SettingsNav() {
  return (
    <nav
      aria-label="Mục cài đặt"
      data-tour="admin-settings-nav"
      className="flex flex-wrap gap-2"
    >
      {SETTINGS_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="inline-flex min-h-[44px] items-center rounded-full border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:border-zinc-500 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
