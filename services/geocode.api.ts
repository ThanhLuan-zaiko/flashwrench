// OpenStreetMap Nominatim geocoding for the booking map picker.
// No API key needed; browsers may call it directly (CORS open).
// Address mapping below is pure and unit-tested.

export type GeocodeResult = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type NominatimAddress = {
  house_number?: string;
  road?: string;
  suburb?: string;
  quarter?: string;
  neighbourhood?: string;
  village?: string;
  city_district?: string;
  district?: string;
  county?: string;
  city?: string;
  town?: string;
  state?: string;
  province?: string;
};

export type MapAddressValues = {
  address: string;
  street: string;
  ward: string;
  district: string;
  province: string;
};

type NominatimItem = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const VIETNAM_CENTER = { lat: 10.7769, lng: 106.7009 };

// Fallback when the customer has not picked a point yet.
export function defaultMapCenter(): { lat: number; lng: number } {
  return { ...VIETNAM_CENTER };
}

function pickFirst(...values: (string | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

// Nominatim admin levels vary by country; map the Vietnamese ones the
// picker fills into the booking address fields.
export function toMapAddressValues(
  displayName: string,
  address: NominatimAddress | undefined,
): MapAddressValues {
  const street = pickFirst(
    address?.house_number && address?.road
      ? `${address.house_number} ${address.road}`
      : undefined,
    address?.road,
  );
  const ward = pickFirst(
    address?.suburb,
    address?.quarter,
    address?.neighbourhood,
    address?.village,
  );
  const district = pickFirst(
    address?.city_district,
    address?.district,
    address?.county,
  );
  const province = pickFirst(
    address?.city,
    address?.town,
    address?.state,
    address?.province,
  );
  const composed = [street, ward, district, province]
    .filter(Boolean)
    .join(", ");
  return {
    address: composed || displayName,
    street,
    ward,
    district,
    province,
  };
}

async function nominatim<T>(path: string): Promise<T> {
  const response = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Nominatim failed: ${response.status}`);
  return (await response.json()) as T;
}

// Biased to Vietnam so "Nguyen Trai" resolves to the HCMC street first.
export async function searchAddresses(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const params = new URLSearchParams({
    q: trimmed,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "vn",
    limit: "6",
  });
  const items = await nominatim<NominatimItem[]>(`/search?${params}`);
  return items
    .map((item) => ({
      id: String(item.place_id),
      label: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<MapAddressValues> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    "accept-language": "vi",
  });
  const item = await nominatim<NominatimItem>(`/reverse?${params}`);
  return toMapAddressValues(item.display_name ?? "", item.address);
}
