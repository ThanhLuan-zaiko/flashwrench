"use client";

import type { ReactNode } from "react";
import { FiCrop, FiStar, FiX } from "react-icons/fi";
import { displayNameFromUrl } from "./cover-staging";
import type { StagedCover } from "./useStagedCovers";

export type CoverKey = {
  kind: "existing" | "staged";
  key: string;
} | null;

type CatalogCoverThumbsProps = {
  existing: string[];
  staged: StagedCover[];
  pinnedCover: CoverKey;
  disabled: boolean;
  onMakeCover: (kind: "existing" | "staged", index: number) => void;
  onRemoveExisting: (url: string) => void;
  onRemoveStaged: (id: string) => void;
  onCropStaged: (id: string) => void;
};

function ThumbButton({
  label,
  ariaLabel,
  onClick,
  disabled,
  children,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StatusBadge({ tone }: { tone: "cover" | "pending" }) {
  const cover = tone === "cover";
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
      {cover && <FiStar aria-hidden="true" className="h-3 w-3 shrink-0" />}
      {cover ? "Ảnh bìa" : "Chờ lưu"}
    </span>
  );
}

// Horizontal gallery rows: photo left, name center, actions right on one
// line, so controls never cover the image and the strip breathes inside
// a narrow modal. Combined order index 0 is the cover.
export function CatalogCoverThumbs({
  existing,
  staged,
  pinnedCover,
  disabled,
  onMakeCover,
  onRemoveExisting,
  onRemoveStaged,
  onCropStaged,
}: CatalogCoverThumbsProps) {
  if (existing.length === 0 && staged.length === 0) return null;

  const isExistingCover = (url: string, index: number) =>
    pinnedCover
      ? pinnedCover.kind === "existing" && pinnedCover.key === url
      : index === 0;
  const isStagedCover = (id: string, index: number) =>
    pinnedCover
      ? pinnedCover.kind === "staged" && pinnedCover.key === id
      : existing.length === 0 && index === 0;

  return (
    <ul aria-label="Ảnh bìa đã chọn" className="flex flex-col gap-2">
      {existing.map((url, index) => {
        const isCover = isExistingCover(url, index);
        return (
          <li
            key={`saved-${url}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950"
          >
            {/* biome-ignore lint/performance/noImgElement: admin preview of stored media asset; optimizer adds no value here. */}
            <img
              src={url}
              alt={isCover ? "Ảnh bìa hiện tại" : `Ảnh ${index + 1}`}
              className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              {isCover && <StatusBadge tone="cover" />}
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {displayNameFromUrl(url)}
              </span>
            </span>
            <span className="flex shrink-0 items-center">
              {!isCover && (
                <ThumbButton
                  label="Đặt bìa"
                  ariaLabel={`Đặt ảnh ${index + 1} làm bìa`}
                  onClick={() => onMakeCover("existing", index)}
                  disabled={disabled}
                >
                  <FiStar aria-hidden="true" className="h-4 w-4 shrink-0" />
                </ThumbButton>
              )}
              <ThumbButton
                label="Xóa"
                ariaLabel={`Xóa ảnh ${index + 1}`}
                onClick={() => onRemoveExisting(url)}
                disabled={disabled}
              >
                <FiX aria-hidden="true" className="h-4 w-4 shrink-0" />
              </ThumbButton>
            </span>
          </li>
        );
      })}
      {staged.map((item, index) => {
        const isCover = isStagedCover(item.id, index);
        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {/* biome-ignore lint/performance/noImgElement: local object-URL preview before upload; next/image cannot handle blob URLs. */}
            <img
              src={item.previewUrl}
              alt={`Ảnh chờ lưu ${index + 1}`}
              className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <StatusBadge tone={isCover ? "cover" : "pending"} />
              <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {item.name}
              </span>
            </span>
            <span className="flex shrink-0 items-center">
              {!isCover && (
                <ThumbButton
                  label="Đặt bìa"
                  ariaLabel={`Đặt ảnh chờ ${index + 1} làm bìa`}
                  onClick={() => onMakeCover("staged", index)}
                  disabled={disabled}
                >
                  <FiStar aria-hidden="true" className="h-4 w-4 shrink-0" />
                </ThumbButton>
              )}
              <ThumbButton
                label="Cắt"
                ariaLabel={`Cắt ảnh chờ ${index + 1}`}
                onClick={() => onCropStaged(item.id)}
                disabled={disabled}
              >
                <FiCrop aria-hidden="true" className="h-4 w-4 shrink-0" />
              </ThumbButton>
              <ThumbButton
                label="Xóa"
                ariaLabel={`Xóa ảnh chờ ${index + 1}`}
                onClick={() => onRemoveStaged(item.id)}
                disabled={disabled}
              >
                <FiX aria-hidden="true" className="h-4 w-4 shrink-0" />
              </ThumbButton>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
