// Photon geocoding (Komoot's hosted OSM geocoder) for the booking map
// picker. The public endpoint needs no API key, allows browser CORS,
// and stays reachable where *.openstreetmap.org is blocked.
// Address mapping below is pure and unit-tested.

export type GeocodeResult = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type PhotonAddress = {
  name?: string;
  housenumber?: string;
  street?: string;
  locality?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
};

export type MapAddressValues = {
  address: string;
  street: string;
  ward: string;
  district: string;
  province: string;
};

type PhotonProperties = PhotonAddress & {
  osm_type?: string;
  osm_id?: number;
};

type PhotonFeature = {
  properties: PhotonProperties;
  geometry: { coordinates: [number, number] };
};

type PhotonResponse = { features: PhotonFeature[] };

const PHOTON_BASE = "https://photon.komoot.io";
const VIETNAM_CENTER = { lat: 10.7769, lng: 106.7009 };
// Rough mainland bounds so the picker only offers Vietnamese places,
// matching the old Nominatim countrycodes=vn filter.
const VIETNAM_BBOX = "102.14,8.18,109.47,23.39";

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

function streetLine(address: PhotonAddress): string {
  return pickFirst(
    address.housenumber && address.street
      ? `${address.housenumber} ${address.street}`
      : undefined,
    address.street,
  );
}

// Suggestion label: POI name first, then the street line and the admin
// chain. Exact repeats collapse so a city repeated at two admin levels
// never shows twice.
export function toPhotonLabel(address: PhotonAddress): string {
  const street = streetLine(address);
  const parts = [
    pickFirst(address.name, street),
    address.name && street ? street : undefined,
    pickFirst(address.district, address.locality),
    pickFirst(address.city, address.county),
    address.state,
  ];
  return [...new Set(parts.filter(Boolean))].join(", ");
}

// Photon's admin levels differ from Nominatim's: for Vietnam the ward
// (phường/xã) usually lands on `district`, the quận/huyện on `county`
// when present, otherwise the province-level `city`.
export function toMapAddressValues(
  label: string,
  address: PhotonAddress | undefined,
): MapAddressValues {
  const street = pickFirst(
    address ? streetLine(address) : undefined,
    address?.name,
  );
  const ward = pickFirst(address?.district, address?.locality);
  const district = pickFirst(address?.county, address?.city);
  const province = pickFirst(address?.state, address?.city);
  const composed = [
    ...new Set([street, ward, district, province].filter(Boolean)),
  ].join(", ");
  return {
    address: composed || label,
    street,
    ward,
    district,
    province,
  };
}

async function photon(path: string): Promise<PhotonResponse> {
  const response = await fetch(`${PHOTON_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Photon failed: ${response.status}`);
  return (await response.json()) as PhotonResponse;
}

// Biased to Vietnam so "Nguyen Trai" resolves to the HCMC street first.
export async function searchAddresses(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const params = new URLSearchParams({
    q: trimmed,
    lat: String(VIETNAM_CENTER.lat),
    lon: String(VIETNAM_CENTER.lng),
    bbox: VIETNAM_BBOX,
    limit: "6",
  });
  const data = await photon(`/api/?${params}`);
  return data.features
    .map((feature, index) => ({
      id: `${feature.properties.osm_type ?? "F"}${feature.properties.osm_id ?? index}`,
      label: toPhotonLabel(feature.properties),
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    }))
    .filter(
      (item) =>
        item.label.length > 0 &&
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lng),
    );
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<MapAddressValues> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    limit: "1",
  });
  const data = await photon(`/reverse?${params}`);
  const properties = data.features[0]?.properties;
  const label = properties ? toPhotonLabel(properties) : "";
  return toMapAddressValues(label, properties);
}
