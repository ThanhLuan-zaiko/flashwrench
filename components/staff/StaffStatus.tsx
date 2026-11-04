type StaffStatusPillProps = {
  live: boolean;
  label: string;
};

// Compact live-state pill for the staff top bar (hidden on phones, where
// the bar keeps only menu, title and tour).
export function StaffStatusPill({ live, label }: StaffStatusPillProps) {
  return (
    <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-[#111111] sm:flex dark:border-zinc-800 dark:text-zinc-200">
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          live
            ? "bg-green-600 motion-safe:animate-pulse dark:bg-green-400"
            : "border border-zinc-400 dark:border-zinc-500"
        }`}
      />
      {label}
    </span>
  );
}

type StaffStatusNoteProps = {
  title: string;
  detail: string;
};

// Short shift note rendered inside the sidebar's white panel card.
export function StaffStatusNote({ title, detail }: StaffStatusNoteProps) {
  return (
    <>
      <p className="flex items-center gap-1.5 text-xs font-bold text-[#111111] dark:text-zinc-100">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-green-600 motion-safe:animate-pulse dark:bg-green-400"
        />
        {title}
      </p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{detail}</p>
    </>
  );
}
