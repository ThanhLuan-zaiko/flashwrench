import type { Metadata } from "next";
import { RescueAdminEntry } from "../components/rescue/RescueAdminEntry";

export const metadata: Metadata = {
  title: "Cứu hộ khẩn cấp | Quản trị FlashWrench",
  description: "Quản lý vùng phục vụ và cấu hình tự điều phối cứu hộ.",
};

export default function AdminRescuePage() {
  return <RescueAdminEntry />;
}
