import Image from "next/image";
import type { StaffArt } from "./staff-art";

type StaffEmptyStateProps = {
  art: StaffArt;
  title: string;
  hint?: string;
};

// Shared "nothing here yet" block for staff lists: a flat isometric
// drawing above a short title and hint, replacing the bare icon.
export function StaffEmptyState({ art, title, hint }: StaffEmptyStateProps) {
  return (
    <div className="mt-4 flex flex-col items-center py-8 text-center">
      <Image
        src={art.src}
        alt=""
        width={art.width}
        height={art.height}
        className="h-24 w-auto"
      />
      <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {title}
      </p>
      {hint && (
        <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}
