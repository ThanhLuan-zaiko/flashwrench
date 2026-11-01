const LOOKUP_SCOPE = [
  {
    title: "Lịch hẹn sửa xe",
    detail: "Trạng thái từng lịch, thợ phụ trách và vị trí thợ trên bản đồ.",
  },
  {
    title: "Yêu cầu cứu hộ",
    detail: "Tiến trình xử lý và thông tin thợ đang tới.",
  },
  {
    title: "Đơn linh kiện",
    detail: "Tình trạng giao hàng và hóa đơn để tải về.",
  },
] as const;

// Side column of /lookup: what a verified email unlocks, as ruled rows, so
// the form column is not left alone on wide screens.
export function LookupScopeList() {
  return (
    <section aria-label="Thông tin tra cứu được">
      <h2 className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
        Bạn xem được
      </h2>
      <dl className="mt-3 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {LOOKUP_SCOPE.map((item) => (
          <div key={item.title} className="py-4">
            <dt className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {item.title}
            </dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {item.detail}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Không cần tạo tài khoản. Mã xác minh được gửi tới email bạn đã dùng khi
        đặt.
      </p>
    </section>
  );
}
