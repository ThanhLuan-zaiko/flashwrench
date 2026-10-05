"use client";

import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { PublicCatalogPager } from "./PublicCatalogPager";
import { PublicServiceCard } from "./PublicServiceCard";
import type { PublicCatalogPage } from "./public-catalog-utils";
import { ServiceQuickViewDialog } from "./ServiceQuickViewDialog";

// Static skeleton ids keep React keys stable without array indexes.
const SKELETON_IDS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
  "skeleton-7",
  "skeleton-8",
];

type PublicCatalogResultsProps = {
  pending: boolean;
  failed: boolean;
  ready: boolean;
  view: PublicCatalogPage;
  hrefFor: (page: number) => string;
  onRetry: () => void;
  serviceIds: readonly string[];
  onToggle: (id: string) => void;
  reasonFor: (service: ServiceItem) => string | null;
};

export function PublicCatalogResults({
  pending,
  failed,
  ready,
  view,
  hrefFor,
  onRetry,
  serviceIds,
  onToggle,
  reasonFor,
}: PublicCatalogResultsProps) {
  // One shared quick-view per grid: the eye button on each card points the
  // dialog at that service. If the service leaves the current page (e.g. a
  // realtime catalog update) the lookup fails and the sheet closes itself.
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = view.pageItems.find((s) => s.id === previewId) ?? null;

  return (
    <>
      {pending && (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4"
        >
          <p className="sr-only">Đang tải dịch vụ</p>
          {SKELETON_IDS.map((skeletonId) => (
            <div
              key={skeletonId}
              className="h-44 rounded-2xl border border-zinc-200 bg-zinc-100 motion-safe:animate-pulse dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      )}
      {failed && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được bảng giá.</p>
          <p className="mt-1 text-xs">Vui lòng kiểm tra mạng rồi thử lại.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold motion-safe:transition-colors motion-safe:duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}
      {ready && view.total === 0 && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Chưa có dịch vụ phù hợp
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Hãy thử từ khóa khác hoặc chọn loại hình khác.
          </p>
        </div>
      )}
      {ready && view.total > 0 && (
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {view.pageItems.map((service) => (
              <PublicServiceCard
                key={service.id}
                service={service}
                selected={serviceIds.includes(service.id)}
                disabledReason={reasonFor(service)}
                onToggle={() => onToggle(service.id)}
                onPreview={() => setPreviewId(service.id)}
              />
            ))}
          </div>
          <PublicCatalogPager
            page={view.safePage}
            pageCount={view.pageCount}
            start={view.start}
            end={view.end}
            total={view.total}
            hrefFor={hrefFor}
          />
        </div>
      )}
      {preview && (
        <ServiceQuickViewDialog
          key={preview.id}
          service={preview}
          selected={serviceIds.includes(preview.id)}
          disabledReason={reasonFor(preview)}
          onToggle={() => onToggle(preview.id)}
          onClose={() => setPreviewId(null)}
        />
      )}
    </>
  );
}
