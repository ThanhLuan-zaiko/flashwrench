import Image from "next/image";

type Step = {
  numeral: string;
  title: string;
  hint: string;
  illustration: string;
};

const STEPS: Step[] = [
  {
    numeral: "1",
    title: "Tạo tài khoản",
    hint: "Đăng ký tài khoản khách hàng.",
    illustration: "/images/isometric/id-card.svg",
  },
  {
    numeral: "2",
    title: "Đặt lịch hoặc mua linh kiện",
    hint: "Đơn đủ điều kiện, hệ thống tự phát voucher vào ví.",
    illustration: "/images/isometric/calendar.svg",
  },
  {
    numeral: "3",
    title: "Dùng đúng tài khoản",
    hint: "Mỗi voucher chỉ dùng được trên đúng tài khoản được phát.",
    illustration: "/images/isometric/wallet-phone.svg",
  },
];

// Three-step route for earning a campaign voucher. Each step is a bordered
// card with its isometric illustration in the corner; stacks on phones.
export function CampaignHowToGet() {
  return (
    <section
      data-reveal
      aria-label="Cách nhận voucher"
      className="flex flex-col gap-4"
    >
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase dark:text-zinc-400">
          Nhận ưu đãi
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#1E3A5F] sm:text-2xl dark:text-zinc-50">
          Cách nhận voucher
        </h2>
      </div>
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {STEPS.map((step) => (
          <li
            key={step.numeral}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-bold text-white"
              >
                {step.numeral}
              </span>
              <Image
                src={step.illustration}
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 -mt-2 -mr-2"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {step.hint}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
