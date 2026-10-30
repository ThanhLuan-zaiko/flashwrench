import Image from "next/image";

// Decorative hero illustration, a static SVG in public/images/isometric. The
// 24/7 badge is an HTML overlay so its text stays crisp. Both are hidden from
// assistive tech because the hero copy already describes the service.
export function RepairScene() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <span
        aria-hidden="true"
        className="absolute top-2 right-2 z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-[#1E3A5F] text-sm font-extrabold tracking-tight text-white sm:top-4 sm:right-4 sm:h-16 sm:w-16 sm:text-base"
      >
        24/7
      </span>
      <Image
        src="/images/isometric/repair-scene.svg"
        alt=""
        width={198}
        height={91}
        className="h-auto w-full"
      />
    </div>
  );
}
