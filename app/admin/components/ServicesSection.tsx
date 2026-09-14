import { FiDollarSign, FiLayers, FiToggleRight } from "react-icons/fi";

const PRICE_GROUPS = [
  {
    title: "Bảo dưỡng tại nhà",
    hint: "Thay dầu, lọc gió, kiểm tra tổng quát.",
    icon: FiLayers,
  },
  {
    title: "Sửa chữa lưu động",
    hint: "Phanh, ắc quy, lốp, điện lạnh, chẩn đoán.",
    icon: FiDollarSign,
  },
  {
    title: "Cứu hộ khẩn cấp",
    hint: "Giá mở cửa, giá theo km và phụ phí đêm.",
    icon: FiToggleRight,
  },
];

export function ServicesSection() {
  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Loại hình sửa chữa"
        className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Loại hình sửa chữa
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Bật hoặc tắt từng loại hình cung cấp cho khách hàng.
          </p>
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {PRICE_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <li
                key={group.title}
                className="flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {group.title}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {group.hint}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  Đang áp dụng
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-label="Bảng giá dịch vụ"
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Bảng giá dịch vụ
        </h2>
        <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Chưa có mục giá nào. Bảng giá chi tiết sẽ hiển thị tại đây khi API
          danh mục dịch vụ được kết nối.
        </p>
      </section>
    </div>
  );
}
