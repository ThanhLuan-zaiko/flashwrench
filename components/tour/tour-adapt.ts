import type { Step, Tour } from "nextstepjs";

// A guide step knows the page it lives on, so the cross-page routes can be
// derived instead of hand-written. `wizardStep` asks the phone booking wizard
// to show that step index before the spotlight is measured.
export type GuideStep = Step & {
  page?: string;
  wizardStep?: number;
};

export type GuideTour = { tour: string; steps: GuideStep[] };

// Returns the tours to hand to NextStep. Each step's nextRoute and prevRoute
// are set to the page of its neighbour whenever that page differs, so a
// tour can cross pages without hand-written routes. Steps without `page`
// pass through unchanged.
export function adaptTours(tours: readonly (Tour | GuideTour)[]): Tour[] {
  return tours.map((tour) => {
    const steps = tour.steps.map((raw, index, all) => {
      const { page, ...base } = raw as GuideStep;
      if (!page) return raw;
      const out: GuideStep = { ...base };
      const next = (all[index + 1] as GuideStep | undefined)?.page;
      const prev = (all[index - 1] as GuideStep | undefined)?.page;
      if (next && next !== page) out.nextRoute = next;
      if (prev && prev !== page) out.prevRoute = prev;
      return out;
    });
    return { tour: tour.tour, steps };
  });
}
