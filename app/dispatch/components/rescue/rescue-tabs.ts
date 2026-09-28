// One URL per rescue status tab so links stay shareable and the browser
// back button works. Mirrors the booking dispatch tabs.
import type { IconType } from "react-icons";
import {
  FiClock,
  FiMapPin,
  FiNavigation,
  FiTruck,
  FiUserCheck,
} from "react-icons/fi";

export type RescueBoardTab =
  | "open"
  | "dispatched"
  | "accepted"
  | "en_route"
  | "arrived";

export type RescueBoardTabDef = {
  id: RescueBoardTab;
  label: string;
  href: string;
  icon: IconType;
};

function tabHref(id: RescueBoardTab): string {
  return `/dispatch/rescue/${id}`;
}

export const DEFAULT_RESCUE_TAB: RescueBoardTab = "open";

export const RESCUE_BOARD_TABS: RescueBoardTabDef[] = [
  { id: "open", label: "Chờ thợ", href: tabHref("open"), icon: FiClock },
  {
    id: "dispatched",
    label: "Đã giao thợ",
    href: tabHref("dispatched"),
    icon: FiNavigation,
  },
  {
    id: "accepted",
    label: "Thợ đã nhận",
    href: tabHref("accepted"),
    icon: FiUserCheck,
  },
  {
    id: "en_route",
    label: "Đang di chuyển",
    href: tabHref("en_route"),
    icon: FiTruck,
  },
  {
    id: "arrived",
    label: "Đã đến nơi",
    href: tabHref("arrived"),
    icon: FiMapPin,
  },
];

export function isRescueBoardTab(value: unknown): value is RescueBoardTab {
  return RESCUE_BOARD_TABS.some((tab) => tab.id === value);
}
