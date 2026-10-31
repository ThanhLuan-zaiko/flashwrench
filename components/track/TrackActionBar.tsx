"use client";

import { FiMessageCircle, FiPhone } from "react-icons/fi";
import { openChatPanel } from "@/components/chat/chat-launcher";
import {
  BRAND_OUTLINE_BUTTON,
  BRAND_PRIMARY_BUTTON,
} from "@/components/ui/brand";
import { usePublicShopProfile } from "@/hooks/shop-settings";

// Docked bottom bar of the tracker: chat support plus a call to the shop
// hotline (the screen's orange action). Without a hotline only chat shows.
export function TrackActionBar() {
  const profile = usePublicShopProfile();
  const hotline = profile.data?.hotline ?? null;
  return (
    <div
      data-dock-bar="phone"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 dark:border-zinc-800 dark:bg-zinc-950 sm:dark:bg-transparent"
    >
      <div className="mx-auto flex max-w-xl gap-2.5 sm:justify-end">
        <button
          type="button"
          onClick={() => openChatPanel()}
          className={`${BRAND_OUTLINE_BUTTON} ${hotline ? "shrink-0 lg:flex-1" : "flex-1 sm:flex-none lg:flex-1"}`}
        >
          <FiMessageCircle aria-hidden="true" className="h-4 w-4" />
          Hỗ trợ
        </button>
        {hotline && (
          <a
            href={`tel:${hotline.replace(/[^\d+]/g, "")}`}
            className={`${BRAND_PRIMARY_BUTTON} min-w-0 flex-1 sm:flex-none lg:flex-1`}
          >
            <FiPhone aria-hidden="true" className="h-4 w-4" />
            Gọi cửa hàng
          </a>
        )}
      </div>
    </div>
  );
}
