// Form state helpers for the campaign dialog: snapshot the editing row
// into input strings, convert datetime-local values, and build the
// create/update payload. Pure so the dialog stays readable.
import type {
  CreateCampaignInput,
  VoucherCampaign,
} from "@/lib/vouchers/voucher.types";

export type CampaignFormState = {
  slug: string;
  name: string;
  description: string;
  discountType: string;
  discountValue: string;
  maxDiscount: string;
  minOrder: string;
  scope: string;
  totalLimit: string;
  perUserLimit: string;
  dispatcherMaxValue: string;
  startAt: string;
  endAt: string;
  allowDispatcherGrant: boolean;
  isActive: boolean;
};

export const EMPTY_CAMPAIGN_FORM: CampaignFormState = {
  slug: "",
  name: "",
  description: "",
  discountType: "fixed",
  discountValue: "50000",
  maxDiscount: "0",
  minOrder: "0",
  scope: "all",
  totalLimit: "100",
  perUserLimit: "1",
  dispatcherMaxValue: "50000",
  startAt: "",
  endAt: "",
  allowDispatcherGrant: true,
  isActive: true,
};

// ISO string -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local">.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// datetime-local -> ISO, or undefined when the field is left blank.
function fromLocalInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function formFromCampaign(item: VoucherCampaign): CampaignFormState {
  return {
    slug: item.slug,
    name: item.name,
    description: item.description,
    discountType: item.discountType,
    discountValue: String(item.discountValue),
    maxDiscount: String(item.maxDiscount),
    minOrder: String(item.minOrder),
    scope: item.scope,
    totalLimit: String(item.totalLimit),
    perUserLimit: String(item.perUserLimit),
    dispatcherMaxValue: String(item.dispatcherMaxValue),
    startAt: toLocalInput(item.startAt),
    endAt: toLocalInput(item.endAt),
    allowDispatcherGrant: item.allowDispatcherGrant,
    isActive: item.isActive,
  };
}

export function formDirty(
  form: CampaignFormState,
  baseline: CampaignFormState,
): boolean {
  return (Object.keys(baseline) as (keyof CampaignFormState)[]).some(
    (key) => form[key] !== baseline[key],
  );
}

// Gallery comes from the deferred cover staging: `gallery` is the ordered
// url list (the first entry is the cover), `imageAssetIds` are only the
// freshly uploaded assets — kept urls need no claim.
export function formToPayload(
  form: CampaignFormState,
  gallery: string[],
  imageAssetIds: string[],
): CreateCampaignInput {
  return {
    slug: form.slug.trim().toLowerCase(),
    name: form.name.trim(),
    description: form.description.trim(),
    images: gallery.map((url) => url.trim()).filter(Boolean),
    imageAssetIds: imageAssetIds.filter(Boolean),
    discountType: form.discountType as CreateCampaignInput["discountType"],
    discountValue: Number(form.discountValue),
    maxDiscount: Number(form.maxDiscount) || 0,
    minOrder: Number(form.minOrder) || 0,
    scope: form.scope as CreateCampaignInput["scope"],
    startAt: fromLocalInput(form.startAt),
    endAt: fromLocalInput(form.endAt),
    totalLimit: Number(form.totalLimit) || 0,
    perUserLimit: Number(form.perUserLimit) || 1,
    allowDispatcherGrant: form.allowDispatcherGrant,
    dispatcherMaxValue: Number(form.dispatcherMaxValue) || 0,
    isActive: form.isActive,
  };
}
