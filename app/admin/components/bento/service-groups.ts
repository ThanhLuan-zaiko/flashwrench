import type { IconType } from "react-icons";
import { FiDollarSign, FiLayers, FiToggleRight } from "react-icons/fi";

export type ServiceGroup = {
  id: string;
  title: string;
  hint: string;
  icon: IconType;
  priceHint: string;
};

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: "maintenance",
    title: "Bảo dưỡng tại nhà",
    hint: "Thay dầu, lọc gió, kiểm tra tổng quát.",
    icon: FiLayers,
    priceHint: "Từ 199.000đ",
  },
  {
    id: "repair",
    title: "Sửa chữa lưu động",
    hint: "Phanh, ắc quy, lốp, điện lạnh, chẩn đoán.",
    icon: FiDollarSign,
    priceHint: "Báo giá theo hạng mục",
  },
  {
    id: "rescue",
    title: "Cứu hộ khẩn cấp",
    hint: "Giá mở cửa, giá theo km và phụ phí đêm.",
    icon: FiToggleRight,
    priceHint: "Mở cửa 299.000đ",
  },
];
