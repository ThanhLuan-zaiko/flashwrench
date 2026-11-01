import { VOUCHER_FAQ } from "./voucher-faq.content";

// Customer Q&A on /vouchers. Native <details> keeps it keyboard and screen
// reader friendly without script; each item is also a sổ tay anchor.
export function VouchersFaq() {
  return (
    <section
      aria-labelledby="vouchers-faq-title"
      className="flex flex-col gap-6"
    >
      <span
        aria-hidden="true"
        className="block h-px bg-zinc-200 dark:bg-zinc-800"
      />
      <h2
        id="vouchers-faq-title"
        className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-white"
      >
        Hỏi đáp về voucher
      </h2>
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {VOUCHER_FAQ.map((item, index) => (
          <details
            key={item.question}
            data-tour={`vouchers-faq-${index}`}
            className="group py-4"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-bold text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100">
              {item.question}
              <span
                aria-hidden="true"
                className="text-zinc-500 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="pt-1 pb-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
