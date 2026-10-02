"use client";

// Shared input chrome for the campaign dialog: one label (htmlFor) +
// optional field error under the control. Plain inputs get `id` from the
// caller so the label association is real; SelectDropdown renders its own
// label and does not go through Field.
export const CAMPAIGN_INPUT =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";
export const CAMPAIGN_LABEL =
  "flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300";

export function CampaignField({
  id,
  label,
  error,
  wide,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${CAMPAIGN_LABEL} ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span className="font-medium text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
