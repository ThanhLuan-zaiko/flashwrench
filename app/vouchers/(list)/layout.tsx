import type { ReactNode } from "react";
import { Suspense } from "react";
import { ScrollTopOnEnter } from "@/components/layout/ScrollTopOnEnter";
import { VouchersList } from "@/components/vouchers/VouchersList";

// Mounts the wallet list once for /vouchers and /vouchers/page/N, so pager
// links reuse the wallet query cache and never replay the enter animation. The
// leaves stay metadata-only.
export default function VouchersListLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <VouchersList />
      </Suspense>
      <ScrollTopOnEnter />
      {children}
    </>
  );
}
