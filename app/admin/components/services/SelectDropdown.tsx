"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { FiCheck, FiChevronDown, FiInbox, FiSearch } from "react-icons/fi";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { filterSelectOptions, type SelectOption } from "./category-filter";

type SelectDropdownProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  allLabel?: string;
  listLabel?: string;
  searchPlaceholder?: string;
  searchThreshold?: number;
  unitName?: string;
  emptyTitle?: string;
  emptyHint?: string;
  icon?: IconType;
  className?: string;
};

// Reusable bento-styled dropdown replacing every native select in the
// admin catalog: bordered trigger, floating panel with search once
// options grow, scrollable list plus a count footer so long lists
// stay scannable instead of overwhelming.
export function SelectDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Chọn…",
  allLabel,
  listLabel,
  searchPlaceholder = "Tìm kiếm…",
  searchThreshold = 5,
  unitName = "mục",
  emptyTitle = "Không tìm thấy lựa chọn phù hợp",
  emptyHint = "Thử từ khóa khác",
  icon: LeadingIcon,
  className = "relative w-full",
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const buttonId = useId();
  const searchId = useId();

  const filtered = useMemo(
    () => filterSelectOptions(options, keyword),
    [options, keyword],
  );
  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );
  const showSearch = options.length > searchThreshold;
  const showFooter = showSearch || allLabel !== undefined;
  const showBadge = allLabel !== undefined && value !== "";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setKeyword("");
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setKeyword("");
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next: string) => {
    setOpen(false);
    setKeyword("");
    if (next !== value) onChange(next);
  };

  const optionClass = (active: boolean) =>
    `flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
      active
        ? "bg-zinc-900 font-semibold text-white dark:bg-white dark:text-zinc-900"
        : "font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
    }`;

  return (
    <div ref={rootRef} className={className}>
      <p
        id={labelId}
        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </p>
      <button
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${buttonId}`}
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left text-sm font-medium text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
      >
        {LeadingIcon && (
          <LeadingIcon
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
          />
        )}
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.label : (allLabel ?? placeholder)}
        </span>
        {showBadge && (
          <span className="shrink-0 rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            Đã lọc
          </span>
        )}
        <FiChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition-transform duration-200 motion-safe:ease-out ${
            open ? "motion-safe:rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          {showSearch && (
            <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
              <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 dark:bg-zinc-900">
                <FiSearch
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
                />
                <label htmlFor={searchId} className="sr-only">
                  {searchPlaceholder}
                </label>
                <input
                  id={searchId}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-11 w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>
          )}
          <div
            role="listbox"
            aria-label={listLabel ?? label}
            className={`flex max-h-64 flex-col gap-0.5 overflow-y-auto p-1.5 ${SCROLLBAR_CLASSES}`}
          >
            {allLabel !== undefined && (
              <button
                type="button"
                role="option"
                aria-selected={value === ""}
                onClick={() => pick("")}
                className={optionClass(value === "")}
              >
                <span className="min-w-0 flex-1 truncate text-left">
                  {allLabel}
                </span>
                <span className="shrink-0 text-xs font-semibold opacity-70">
                  {options.length}
                </span>
                {value === "" && (
                  <FiCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
                )}
              </button>
            )}
            {filtered.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(option.value)}
                  className={optionClass(active)}
                >
                  <span className="min-w-0 flex-1 truncate text-left">
                    {option.label}
                  </span>
                  {active && (
                    <FiCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-4 dark:bg-zinc-900">
                <FiInbox
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400"
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {emptyTitle}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {emptyHint}
                  </span>
                </span>
              </div>
            )}
          </div>
          {showFooter && (
            <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {keyword.trim()
                ? `Tìm thấy ${filtered.length} trên ${options.length} ${unitName}`
                : `${options.length} ${unitName}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
