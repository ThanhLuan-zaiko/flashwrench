import type { Metadata } from "next";
import { HomeHero } from "@/components/home/HomeHero";
import { ServicesBento } from "@/components/home/services/ServicesBento";
import { StepsBento } from "@/components/home/steps/StepsBento";

export const metadata: Metadata = {
  title: "FlashWrench - Sửa xe lưu động tận nơi",
  description:
    "Đặt thợ sửa xe lưu động, cứu hộ khẩn cấp 24/7 với bảng giá minh bạch.",
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <HomeHero />
      <ServicesBento />
      <StepsBento />
    </main>
  );
}
