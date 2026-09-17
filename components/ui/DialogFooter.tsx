import { FiLoader, FiSave } from "react-icons/fi";

type DialogFooterProps = {
  submitLabel: string;
  pending: boolean;
  submitDisabled?: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

// Shared sticky action bar for tall dialogs. The panel is the only scroll
// region, so this bar pins to its bottom with a solid surface while the
// form scrolls underneath. Callers resolve the submit label themselves.
export function DialogFooter({
  submitLabel,
  pending,
  submitDisabled = false,
  onClose,
  onSubmit,
}: DialogFooterProps) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-4 -mb-5 flex gap-2 border-t border-zinc-200 bg-white px-5 pt-3 pb-5 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6 dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={onClose}
        className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Hủy bỏ
      </button>
      <button
        type="button"
        disabled={pending || submitDisabled}
        onClick={onSubmit}
        className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        ) : (
          <FiSave aria-hidden="true" className="h-4 w-4" />
        )}
        {submitLabel}
      </button>
    </div>
  );
}
