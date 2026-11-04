import { type ReactNode, Suspense } from "react";

// Centred reading column shared by the wallet and campaign detail pages.
export function VoucherDetailColumn({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}
