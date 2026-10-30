import type { PartItem } from "@/lib/parts/parts.types";

type ProductSpecsBentoProps = {
  specs: PartItem["specs"];
  carModels: string[];
};

// Specs and compatible models as a two-part bento: the spec tiles take two
// columns, the compatible-model list sits beside them on wide screens.
export function ProductSpecsBento({
  specs,
  carModels,
}: ProductSpecsBentoProps) {
  const entries = Object.entries(specs ?? {});
  if (entries.length === 0 && carModels.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      {entries.length > 0 && (
        <section
          data-reveal
          aria-label="Thông số kỹ thuật"
          className="rounded-2xl border border-zinc-200 p-5 md:col-span-2 md:p-6 dark:border-zinc-800"
        >
          <h2 className="text-lg font-bold tracking-tight text-[#1E3A5F] dark:text-zinc-50">
            Thông số kỹ thuật
          </h2>
          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {key}
                </dt>
                <dd className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {carModels.length > 0 && (
        <section
          data-reveal
          aria-label="Xe tương thích"
          className="rounded-2xl border border-zinc-200 p-5 md:p-6 dark:border-zinc-800"
        >
          <h2 className="text-lg font-bold tracking-tight text-[#1E3A5F] dark:text-zinc-50">
            Xe tương thích
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Kiểm tra dòng xe trước khi đặt mua.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {carModels.map((model) => (
              <li
                key={model}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                {model}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
