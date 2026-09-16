import type { Metadata } from "next";
import { NavigationSection } from "../components/navigation/NavigationSection";

export const metadata: Metadata = {
  title: "Điều hướng | Thợ xe FlashWrench",
  description: "Bản đồ điểm sửa xe, khoảng cách và chỉ đường cho thợ.",
};

export default function MechanicMapPage() {
  return <NavigationSection />;
}
