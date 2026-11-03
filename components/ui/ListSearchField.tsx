type ListSearchFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

// Plain search input for staff list pages. The parent filters the rows it
// already holds and resets pagination when the value changes.
export function ListSearchField({
  id,
  value,
  onChange,
  placeholder,
}: ListSearchFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
      >
        Tìm kiếm
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-400"
      />
    </div>
  );
}

// Shown when a search or filter leaves no rows, so the list never looks empty
// without an explanation.
export function ListNoMatch() {
  return (
    <p className="py-6 text-center text-sm text-zinc-600 dark:text-zinc-300">
      Không tìm thấy kết quả phù hợp.
    </p>
  );
}
