import { BOOKING_TRACK_STAGES } from "@/lib/track/booking-track-view";

type TrackHeroProps = {
  stage: number;
  // Rough minutes to arrival from the mechanic's live pin, or null.
  etaMin: number | null;
  detail: string | null;
};

// Navy status band at the top of the tracker. While the mechanic is on
// the way and both pins are known it leads with the rough ETA; otherwise
// with the current stage name.
export function TrackHero({ stage, etaMin, detail }: TrackHeroProps) {
  const label = BOOKING_TRACK_STAGES[stage];
  return (
    <section
      aria-label="Trạng thái hiện tại"
      className="bg-[#1E3A5F] px-4 pt-3 pb-16 text-white sm:rounded-3xl sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 lg:pb-8"
    >
      <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
        {etaMin !== null ? label : "Trạng thái"}
      </p>
      {etaMin !== null ? (
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl leading-none font-extrabold tracking-tight">
            {etaMin}
          </span>
          <span className="text-sm font-semibold text-zinc-200">phút nữa</span>
        </p>
      ) : (
        <p className="mt-1 text-3xl font-extrabold tracking-tight lg:text-4xl">
          {label}
        </p>
      )}
      {detail && <p className="mt-2 text-xs text-zinc-300">{detail}</p>}
    </section>
  );
}
