import { MaskLines } from "@/components/home/MaskLines";

type ProductChapterHeadProps = {
  title: string;
};

// Opening of a product-page chapter: a hairline rule, then the masked headline
// at the same scale as the home chapters. The rule and the lines take the
// chapter motion from the enclosing section's useChapterMotion.
export function ProductChapterHead({ title }: ProductChapterHeadProps) {
  return (
    <div className="flex flex-col">
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <MaskLines
        lines={[title]}
        className="mt-8 text-2xl font-bold tracking-tight text-zinc-900 md:mt-10 md:text-3xl dark:text-zinc-50"
      />
    </div>
  );
}
