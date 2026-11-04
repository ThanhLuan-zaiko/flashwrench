"use client";

import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FiChevronDown } from "react-icons/fi";
import type { PopupAlign, PopupWidth } from "@/components/ui/popup-position";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { usePopupPlacement } from "@/hooks/usePopupPlacement";

type PickerFieldProps = {
  id: string;
  /** Trigger text; the placeholder shows while this is empty. */
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: "true" }>;
  /** Accessible name of the popup. */
  panelLabel: string;
  /** Popup width in pixels; a stable function. */
  panelWidth: PopupWidth;
  align?: PopupAlign;
  /** Trigger width classes; defaults to the full field width. */
  className?: string;
  disabled?: boolean;
  error?: boolean;
  children: (close: () => void) => ReactNode;
};

const BUTTON_BASE =
  "flex min-h-[44px] w-full items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-50";
const BUTTON_OK =
  "border-zinc-500 focus-visible:ring-zinc-500 dark:border-zinc-500";
const BUTTON_ERROR =
  "border-red-500 focus-visible:ring-red-500 dark:border-red-400";
const PANEL = `fixed m-0 min-w-0 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 ${SCROLLBAR_CLASSES}`;

// Trigger and popup shared by the date, time and month pickers, styled like
// DropdownSelect. The popup renders in the browser's top layer, so animated
// cards and scrolling dialogs around the field can never cover or clip it.
// Outside click and Escape close it; Escape stops at the capture phase so a
// dialog around the field stays open.
export function PickerField({
  id,
  label,
  placeholder,
  icon: Icon,
  panelLabel,
  panelWidth,
  align = "start",
  className = "",
  disabled,
  error,
  children,
}: PickerFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLFieldSetElement>(null);
  const placement = usePopupPlacement(
    open,
    triggerRef,
    panelRef,
    panelWidth,
    align,
  );

  const attachPanel = useCallback((node: HTMLFieldSetElement | null) => {
    panelRef.current = node;
    node?.showPopover();
  }, []);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-invalid={error || undefined}
        className={`${BUTTON_BASE} ${error ? BUTTON_ERROR : BUTTON_OK}`}
      >
        <Icon
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-400"
        />
        <span
          className={`min-w-0 flex-1 truncate ${label ? "font-medium" : "text-zinc-600 dark:text-zinc-400"}`}
        >
          {label || placeholder}
        </span>
        <FiChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200 dark:text-zinc-400 ${open ? "motion-safe:rotate-180" : ""}`}
        />
      </button>

      {open && (
        <fieldset
          ref={attachPanel}
          popover="manual"
          className={`${PANEL} ${placement ? "" : "invisible"}`}
          style={
            placement
              ? {
                  inset: "auto",
                  left: placement.left,
                  top: placement.top,
                  width: placement.width,
                  height: "fit-content",
                  maxHeight: placement.maxHeight,
                }
              : { inset: "auto", left: 0, top: 0 }
          }
        >
          <legend className="sr-only">{panelLabel}</legend>
          {children(close)}
        </fieldset>
      )}
    </div>
  );
}
