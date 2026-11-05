"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { HomePromoList } from "@/components/home/promotions/HomePromoList";
import {
  usePublicCatalog,
  useServiceCatalogRealtime,
} from "@/hooks/public-catalog";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { useCanonicalizePage, useRoutePage } from "@/hooks/useRoutePage";
import { useServiceBookingPlan } from "@/hooks/useServiceBookingPlan";
import { countServicesByCategory } from "@/lib/catalog/catalog-counts";
import { GuestOfferNote } from "../vouchers/GuestOfferNote";
import { PublicCatalogFilter } from "./PublicCatalogFilter";
import { PublicCatalogResults } from "./PublicCatalogResults";
import {
  filterPublicServices,
  PUBLIC_CATALOG_PAGE_SIZE,
  paginatePublicServices,
  resolveTabCategory,
} from "./public-catalog-utils";
import { ServiceBookingConflictDialog } from "./ServiceBookingConflictDialog";
import { ServicesCategoryHeader } from "./ServicesCategoryHeader";
import { ServicesClosingCta } from "./ServicesClosingCta";
import { ServicesIntro } from "./ServicesIntro";
import { ServicesSelectionBar } from "./ServicesSelectionBar";

// Public /services landing: browse active prices and book. Admin edits on
// /admin/services publish to the service-catalog topic; this screen
// invalidates its query on each event and refetches over HTTPS.
//
// The active tab comes from the URL (/services plus /services/[slug]) and
// the page from the trailing /page/N segment, but the screen itself stays
// mounted inside the /services layout while tabs or pages switch. Switches
// therefore reuse the cached catalog and the search text, and never replay
// the enter animation.
export function ServicesLanding({ activeSlug }: { activeSlug: string | null }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const searchId = useId();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { page, firstPageHref, hrefFor } = useRoutePage();
  const catalog = usePublicCatalog();
  useServiceCatalogRealtime(true);
  const realtime = useRealtimeStatus();
  const live = realtime === "live";

  const categories = useMemo(
    () => catalog.data?.categories ?? [],
    [catalog.data],
  );
  const services = useMemo(() => catalog.data?.services ?? [], [catalog.data]);
  const plan = useServiceBookingPlan(services, catalog.isSuccess);
  const activeCategory = useMemo(
    () => resolveTabCategory(categories, activeSlug),
    [categories, activeSlug],
  );
  const categoryId = activeCategory?.id ?? "";
  const serviceCounts = useMemo(
    () => countServicesByCategory(services),
    [services],
  );
  // An unknown slug only counts once the catalog has loaded: while pending
  // the category may simply not have arrived yet.
  const unknownSlug =
    catalog.isSuccess && activeSlug !== null && activeCategory === null;
  const filtered = useMemo(
    () => filterPublicServices(services, { categoryId, query }),
    [services, categoryId, query],
  );
  const view = useMemo(
    () => paginatePublicServices(filtered, page - 1, PUBLIC_CATALOG_PAGE_SIZE),
    [filtered, page],
  );

  // A tab switch drops the /page/N segment by itself, so only typing a new
  // search while deep-paged needs an explicit hop back to the list root.
  const typeQuery = (next: string) => {
    setQuery(next);
    if (page > 1) router.replace(firstPageHref, { scroll: false });
  };
  // view.safePage is 0-based; the URL segment is 1-based.
  const pageHref = (zeroBased: number) => hrefFor(zeroBased + 1);

  // Canonicalize: a typed /page/N beyond the last page rewrites itself to
  // the real last page once the catalog has loaded.
  useCanonicalizePage(view.pageCount, catalog.isSuccess && !unknownSlug);

  return (
    <div
      ref={rootRef}
      className={`flex w-full flex-col ${plan.queuedIds.length > 0 ? "pb-36 sm:pb-48" : plan.serviceIds.length > 0 ? "pb-24 sm:pb-36" : ""}`}
    >
      <ServicesIntro
        live={live}
        countText={
          catalog.isPending
            ? "Đang tải bảng giá…"
            : `${view.total} dịch vụ sẵn sàng đặt lịch`
        }
      />
      <div
        data-tour="guide-services"
        className="mx-auto max-w-7xl w-full px-4 pt-10 sm:px-6 md:pt-12 lg:px-8"
      >
        <PublicCatalogFilter
          categories={categories}
          activeSlug={unknownSlug ? null : activeSlug}
          query={query}
          searchId={searchId}
          onQuery={typeQuery}
        />
      </div>
      {activeCategory && (
        <div className="mx-auto max-w-7xl w-full px-4 pt-8 sm:px-6 lg:px-8">
          <ServicesCategoryHeader
            category={activeCategory}
            serviceCount={serviceCounts.get(activeCategory.id) ?? 0}
          />
        </div>
      )}
      <div className="mx-auto max-w-7xl w-full px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/rescue"
          prefetch
          className="group flex items-center justify-between gap-4 border-t border-zinc-200 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold tracking-wide text-[#111111] uppercase dark:text-zinc-400">
              Hỏng xe giữa đường?
            </span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Gọi cứu hộ 24/7
            </span>
          </span>
          <FiArrowRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-[#111111] motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5 dark:text-zinc-100"
          />
        </Link>
      </div>
      {unknownSlug && (
        <div className="mx-auto max-w-7xl w-full px-4 py-8 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Loại hình này không còn được áp dụng
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Cửa hàng vừa thay đổi danh mục. Hãy xem toàn bộ dịch vụ đang có.
          </p>
          <Link
            href="/services"
            scroll={false}
            className="mx-auto mt-4 flex min-h-11 w-fit items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300"
          >
            Xem tất cả dịch vụ
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mx-auto max-w-7xl w-full px-4 pt-8 sm:px-6 md:pt-10 lg:px-8">
        <GuestOfferNote next="/services" />
        <PublicCatalogResults
          pending={catalog.isPending}
          failed={catalog.isError}
          ready={catalog.isSuccess && !unknownSlug}
          view={view}
          hrefFor={pageHref}
          onRetry={() => void catalog.refetch()}
          serviceIds={plan.serviceIds}
          queuedIds={plan.queuedIds}
          onToggle={plan.toggle}
          reasonFor={plan.reasonFor}
          separateFor={plan.separateFor}
        />
      </div>
      <HomePromoList title="Ưu đãi cho khách đặt dịch vụ" audience="booking" />
      <ServicesClosingCta />
      <ServicesSelectionBar
        serviceIds={plan.serviceIds}
        selection={plan.selection}
        queuedServices={plan.queuedServices}
        ready={catalog.isSuccess}
        onRemove={plan.remove}
        onRemoveQueued={plan.removeQueued}
        onClear={plan.clear}
      />
      {plan.conflict && (
        <ServiceBookingConflictDialog
          service={plan.conflict.service}
          selected={plan.conflict.selected}
          message={plan.conflict.message}
          onQueue={plan.queueConflict}
          onSwitch={plan.switchToConflict}
          onClose={plan.dismissConflict}
        />
      )}
    </div>
  );
}
