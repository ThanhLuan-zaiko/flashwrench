"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { PromoBannerSection } from "@/components/promotions/PromoBannerSection";
import {
  usePublicCatalog,
  useServiceCatalogRealtime,
} from "@/hooks/public-catalog";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useBookingServiceSelection } from "@/hooks/useBookingServiceSelection";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { useCanonicalizePage, useRoutePage } from "@/hooks/useRoutePage";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { PublicCatalogFilter } from "./PublicCatalogFilter";
import { PublicCatalogResults } from "./PublicCatalogResults";
import {
  filterPublicServices,
  PUBLIC_CATALOG_PAGE_SIZE,
  paginatePublicServices,
  resolveTabCategory,
} from "./public-catalog-utils";
import { ServicesAccountCta } from "./ServicesAccountCta";
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
  const draft = useBookingServiceSelection();
  useServiceCatalogRealtime(true);
  const realtime = useRealtimeStatus();
  const live = realtime === "live";

  const categories = useMemo(
    () => catalog.data?.categories ?? [],
    [catalog.data],
  );
  const services = useMemo(() => catalog.data?.services ?? [], [catalog.data]);
  const selection = useMemo(
    () => getBookingServiceSelection(draft.serviceIds, services),
    [draft.serviceIds, services],
  );
  const activeCategory = useMemo(
    () => resolveTabCategory(categories, activeSlug),
    [categories, activeSlug],
  );
  const categoryId = activeCategory?.id ?? "";
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
  const reasonFor = (service: ServiceItem) =>
    draft.serviceIds.includes(service.id)
      ? null
      : getBookingServiceSelection([...draft.serviceIds, service.id], services)
          .issue;

  // Canonicalize: a typed /page/N beyond the last page rewrites itself to
  // the real last page once the catalog has loaded.
  useCanonicalizePage(view.pageCount, catalog.isSuccess);

  return (
    <div
      ref={rootRef}
      className={`flex flex-col gap-6 md:gap-8 ${draft.serviceIds.length > 0 ? "pb-48 sm:pb-36" : ""}`}
    >
      <BigTypeHeader
        level={1}
        eyebrow="Dịch vụ"
        title="Chọn dịch vụ, thợ tới nơi."
        subtitle="Chọn dịch vụ cần làm, rồi nhấn “Tiếp tục đặt lịch”. Một lịch hẹn cho cùng một xe, địa chỉ và giờ hẹn; không cần tài khoản."
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <output
          aria-label={live ? "Realtime đang hoạt động" : "Realtime mất kết nối"}
          className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${live ? "bg-zinc-900 dark:bg-white" : "border border-zinc-400 dark:border-zinc-500"}`}
          />
          {live ? "Giá cập nhật trực tiếp" : "Đang nối lại giá trực tiếp…"}
        </output>
        <p
          aria-live="polite"
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          {catalog.isPending
            ? "Đang tải bảng giá…"
            : `${view.total} dịch vụ sẵn sàng đặt lịch`}
        </p>
      </div>

      <PublicCatalogFilter
        categories={categories}
        activeSlug={unknownSlug ? null : activeSlug}
        query={query}
        searchId={searchId}
        onQuery={typeQuery}
      />
      <PromoBannerSection
        title="Ưu đãi cho khách đặt dịch vụ"
        subtitle="Tạo tài khoản để hệ thống tự phát voucher khi đủ điều kiện."
        audience="booking"
      />

      {unknownSlug && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Loại hình này không còn được áp dụng
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Cửa hàng vừa thay đổi danh mục. Hãy xem toàn bộ dịch vụ đang có.
          </p>
          <Link
            href="/services"
            scroll={false}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          >
            Xem tất cả dịch vụ
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}

      <PublicCatalogResults
        pending={catalog.isPending}
        failed={catalog.isError}
        ready={catalog.isSuccess && !unknownSlug}
        view={view}
        hrefFor={pageHref}
        onRetry={() => void catalog.refetch()}
        serviceIds={draft.serviceIds}
        onToggle={draft.toggleService}
        reasonFor={reasonFor}
      />

      <section
        aria-label="Đặt lịch trong 1 phút"
        data-reveal
        className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Đã chọn được dịch vụ ưng ý?
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Đặt nhanh một dịch vụ hoặc thêm nhiều dịch vụ vào cùng lịch hẹn. Tạo
            tài khoản nếu bạn muốn lưu lịch sử và dùng voucher.
          </p>
        </div>
        <ServicesAccountCta />
      </section>
      <ServicesSelectionBar
        serviceIds={draft.serviceIds}
        selection={selection}
        ready={catalog.isSuccess}
        onRemove={(id) => draft.toggleService(id)}
        onClear={() => draft.setServiceIds([])}
      />
    </div>
  );
}
