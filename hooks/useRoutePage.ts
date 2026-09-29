"use client";

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect } from "react";
import {
  pagePath,
  parsePageParam,
  stripPageSegment,
} from "@/lib/pagination/page-param";

// Reads the trailing `/page/N` segment for screens mounted once in a
// route layout. Returns the 1-based page, the list root (pathname minus
// the page segment) and `hrefFor` for pager Links — existing query
// params (e.g. /products?cat=) ride along on every page link.
export function useRoutePage() {
  const params = useParams();
  const pathname = usePathname();
  const search = useSearchParams();
  const page = parsePageParam(params.page) ?? 1;
  const basePath = stripPageSegment(pathname);
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return {
    page,
    basePath,
    firstPageHref: `${basePath}${suffix}`,
    hrefFor: (target: number) => `${pagePath(basePath, target)}${suffix}`,
  };
}

// Rewrites a typed `/page/N` that overshoots the real last page once the
// list length is known — client-sliced lists only, since cursor lists can
// never know their page count. `ready` gates the check until data lands.
export function useCanonicalizePage(pageCount: number, ready: boolean) {
  const router = useRouter();
  const { page, hrefFor } = useRoutePage();
  useEffect(() => {
    if (ready && page > Math.max(1, pageCount)) {
      router.replace(hrefFor(Math.max(1, pageCount)), { scroll: false });
    }
  }, [ready, page, pageCount, hrefFor, router]);
}
