import { VOUCHER_FAQ } from "./voucher-faq.content";

// Customer Q&A on /vouchers. Native <details> keeps it keyboard and screen
// reader friendly without script; each item is also a sổ tay anchor.
export function VouchersFaq() {
  return (
    <section
      aria-labelledby="vouchers-faq-title"
      className="flex flex-col gap-3"
    >
      <h2
        id="vouchers-faq-title"
        className="text-base font-bold tracking-tight text-zinc-900 dark:text-white"
      >
        Hỏi đáp về voucher
      </h2>
      <div className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {VOUCHER_FAQ.map((item, index) => (
          <details
            key={item.question}
            data-tour={`vouchers-faq-${index}`}
            className="group px-4 py-3 sm:px-5"
          >
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-100">
              {item.question}
              <span
                aria-hidden="true"
                className="text-zinc-500 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="pb-2 pt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
