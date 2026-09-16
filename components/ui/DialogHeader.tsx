import { FiX } from "react-icons/fi";

type DialogHeaderProps = {
  title: string;
  hint: string;
  onClose: () => void;
};

// Shared modal header: title, guidance hint and close button.
export function DialogHeader({ title, hint, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng hộp thoại"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <FiX aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
}
