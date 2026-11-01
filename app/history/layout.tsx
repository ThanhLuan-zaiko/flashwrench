import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { HistoryTabs } from "@/components/history/HistoryTabs";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import { getServerAccountSession } from "@/lib/auth/server-session";

// Shared /history shell: auth guard, page frame and the URL tab bar.
// Each tab page renders its own panel inside this layout.
export default async function HistoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerAccountSession();
  if (!session.user) {
    redirect(buildLoginHref("/history"));
  }

  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl flex w-full flex-col gap-6 px-4 pt-8 pb-16 sm:px-6 md:gap-8 lg:px-8">
        <HistoryTabs />
        {children}
        <SpeculationRules scope="history" />
      </div>
    </main>
  );
}
