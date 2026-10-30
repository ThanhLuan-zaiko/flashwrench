import Image from "next/image";

type TrustItem = {
  title: string;
  hint: string;
  illustration: string;
};

// Three promises under the hero, each a bordered card with a large isometric
// illustration. The brand line comes from the product.
export function ProductTrustStrip({ brand }: { brand: string }) {
  const items: TrustItem[] = [
    {
      title: "Hàng chính hãng",
      hint: `Sản phẩm chính hãng từ ${brand}.`,
      illustration: "/images/isometric/package.svg",
    },
    {
      title: "Thợ lắp tận nơi",
      hint: "Đặt thợ lưu động thay linh kiện ngay tại chỗ của bạn.",
      illustration: "/images/isometric/van.svg",
    },
    {
      title: "Đặt lịch dễ dàng",
      hint: "Chọn giờ phù hợp và theo dõi thợ trên bản đồ.",
      illustration: "/images/isometric/wrench.svg",
    },
  ];

  return (
    <section data-reveal aria-label="Cam kết khi mua hàng">
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <Image
              src={item.illustration}
              alt=""
              width={96}
              height={96}
              className="h-20 w-20 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E3A5F] dark:text-zinc-50">
                {item.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {item.hint}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
