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
      className="bg-[#FACC15] px-4 pt-3 pb-16 text-[#111111] sm:rounded-3xl sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 lg:pb-8"
    >
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111111]/70 uppercase">
        {etaMin !== null ? label : "Trạng thái"}
      </p>
      {etaMin !== null ? (
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl leading-none font-extrabold tracking-tight">
            {etaMin}
          </span>
          <span className="text-sm font-semibold text-[#111111]/85">
            phút nữa
          </span>
        </p>
      ) : (
        <p className="mt-1 text-2xl font-extrabold tracking-tight lg:text-3xl">
          {label}
        </p>
      )}
      {detail && <p className="mt-2 text-xs text-[#111111]/70">{detail}</p>}
    </section>
  );
}
