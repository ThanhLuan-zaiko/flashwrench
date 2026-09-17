import type {
  PriceUnit,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";
import { initialGalleryFromItem, isGalleryDirty } from "./cover-staging";

export type ServiceItemDraft = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  priceUnit: PriceUnit;
  durationMin: string;
  isHomeSupported: boolean;
  isEmergencySupported: boolean;
};

// True while a price dialog holds anything unsaved: typed fields,
// toggles, gallery picks, or an upload/save still in flight. Pure so
// bun:test covers it; the dialog feeds it straight into the guard.
export function isServiceItemDirty(args: {
  editing: ServiceItem | null;
  preset: string;
  liveFirstId: string;
  draft: ServiceItemDraft;
  existing: string[];
  stagedCount: number;
  pending: boolean;
}): boolean {
  const { editing, preset, liveFirstId, draft } = args;
  if (args.pending) return true;
  // Empty preset falls through to the live default, mirroring the dialog
  // sync effect: a pristine create form must not count as dirty just
  // because the category list arrived after mount.
  const initialCategoryId = editing?.categoryId ?? (preset || liveFirstId);
  return (
    draft.categoryId !== initialCategoryId ||
    draft.name !== (editing?.name ?? "") ||
    draft.slug !== (editing?.slug ?? "") ||
    draft.description !== (editing?.description ?? "") ||
    draft.basePrice !== String(editing?.basePrice ?? 199000) ||
    draft.priceUnit !== (editing?.priceUnit ?? "per_job") ||
    draft.durationMin !== String(editing?.durationMin ?? 60) ||
    draft.isHomeSupported !== (editing?.isHomeSupported ?? true) ||
    draft.isEmergencySupported !== (editing?.isEmergencySupported ?? false) ||
    isGalleryDirty(
      initialGalleryFromItem(editing),
      args.existing,
      args.stagedCount,
    )
  );
}
