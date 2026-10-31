import Image from "next/image";
import type { ReactNode } from "react";
import type { StaffArt } from "./staff-art";

// Decorative drawing beside a staff dashboard title. Hidden on phones,
// where the header row stays compact.
export function StaffHeroArt({ art }: { art: StaffArt }) {
  return (
    <Image
      src={art.src}
      alt=""
      width={art.width}
      height={art.height}
      className="hidden h-16 w-auto shrink-0 sm:block"
    />
  );
}

// Drawing placed to the left of a chart's headline figure.
export function StaffAsideArt({
  art,
  children,
}: {
  art: StaffArt;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <StaffHeroArt art={art} />
      {children}
    </div>
  );
}
