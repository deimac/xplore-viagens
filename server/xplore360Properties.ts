// Hospedagens do xplore360: imóveis de parceiros do site/TV lidos do endpoint público.
// Ativado por PROPERTIES_SOURCE=xplore360 (padrão: mysql). Usa XPLORE360_SHOWCASE_URL/KEY.

export type PropertiesChannel = "site" | "tv";

export function isXplore360Properties(): boolean {
  return (process.env.PROPERTIES_SOURCE || "mysql").trim().toLowerCase() === "xplore360";
}

export interface PublicPropertyListItem {
  code: number;
  slug: string;
  name: string;
  city: string;
  state_region: string | null;
  country: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  area_m2: number | null;
  xp: number;
  is_featured: boolean;
  primary_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicPropertyRoom {
  name: string;
  room_type_name: string;
  room_type_icon: string | null;
  photo_url: string | null;
  sort: number;
  beds: { bed_type_name: string; sleeps: number; quantity: number }[];
}

export interface PublicPropertyItem extends PublicPropertyListItem {
  description_short: string | null;
  description_full: string | null;
  address_street: string | null;
  address_number: string | null;
  neighborhood: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  images: { url: string }[];
  amenities: { name: string; icon: string | null }[];
  rooms: PublicPropertyRoom[];
}

export function toLegacyPropertyListItem(item: PublicPropertyListItem, channel: PropertiesChannel = "site") {
  return {
    id: item.code,
    slug: item.slug,
    name: item.name,
    city: item.city,
    state_region: item.state_region,
    country: item.country,
    max_guests: item.max_guests,
    bedrooms: item.bedrooms,
    beds: item.beds,
    bathrooms: item.bathrooms,
    area_m2: item.area_m2,
    xp: item.xp,
    is_featured: !!item.is_featured,
    primary_image: item.primary_image || "",
    mostrarNoSite: channel === "site",
    mostrarNaTv: channel === "tv",
    active: true,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}
export type LegacyPropertyListItem = ReturnType<typeof toLegacyPropertyListItem>;

export function groupByCityCountry(items: LegacyPropertyListItem[]): Record<string, LegacyPropertyListItem[]> {
  const sorted = [...items].sort(
    (a, b) => a.city.localeCompare(b.city, "pt-BR") || a.name.localeCompare(b.name, "pt-BR"),
  );
  const out: Record<string, LegacyPropertyListItem[]> = {};
  for (const p of sorted) (out[`${p.city}, ${p.country}`] ??= []).push(p);
  return out;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Até 6: destaques primeiro (ordem aleatória), completa com outros também aleatórios.
export function pickFeatured(items: LegacyPropertyListItem[], rand: () => number = Math.random) {
  const featured = shuffle(items.filter((p) => p.is_featured), rand).slice(0, 6);
  if (featured.length >= 6) return featured;
  const others = shuffle(items.filter((p) => !p.is_featured), rand).slice(0, 6 - featured.length);
  return [...featured, ...others];
}

export function toLegacyPropertyDetail(item: PublicPropertyItem) {
  return {
    ...toLegacyPropertyListItem(item),
    description_short: item.description_short,
    description_full: item.description_full,
    address_street: item.address_street,
    address_number: item.address_number,
    neighborhood: item.neighborhood,
    postal_code: item.postal_code,
    latitude: item.latitude,
    longitude: item.longitude,
    images: (item.images ?? []).map((im, i) => ({ id: i + 1, image_url: im.url })),
    amenities: (item.amenities ?? []).map((a, i) => ({ id: i + 1, name: a.name, icon: a.icon })),
  };
}

export function toLegacyRoomsWithBeds(item: PublicPropertyItem) {
  return (item.rooms ?? [])
    .filter((r) => (r.beds ?? []).length > 0)
    .map((r, i) => ({
      id: i + 1,
      name: r.name,
      roomTypeName: r.room_type_name,
      sleepingPhoto: r.photo_url ?? null,
      beds: r.beds.map((b) => ({ quantity: b.quantity, bedTypeName: b.bed_type_name, sleepsCount: b.sleeps })),
    }));
}

// Cópia mínima da regra do xplore360 (src/domains/travel/properties/lib/rooms.ts).
export function roomsSummary(
  rooms: { roomTypeName: string; roomTypeIcon: string | null; beds: { quantity: number }[] }[],
) {
  const groups = new Map<string, { name: string; icon: string | null; total: number; beds: number }>();
  let totalBeds = 0;
  for (const room of rooms) {
    const beds = room.beds.reduce((sum, b) => sum + b.quantity, 0);
    totalBeds += beds;
    const g = groups.get(room.roomTypeName);
    if (g) {
      g.total += 1;
      g.beds += beds;
    } else {
      groups.set(room.roomTypeName, { name: room.roomTypeName, icon: room.roomTypeIcon, total: 1, beds });
    }
  }
  return { rooms_summary: Array.from(groups.values()), total_beds: totalBeds };
}

const TTL_MS = 60_000;
const ERROR_TTL_MS = 15_000;
const FETCH_TIMEOUT_MS = 5_000;
type Entry = { at: number; data: any; failed?: boolean };
const cache = new Map<string, Entry>();
const logged = new Set<string>();

export function resetPropertiesCache() {
  cache.clear();
  logged.clear();
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < (hit.failed ? ERROR_TTL_MS : TTL_MS)) return hit.data as T | null;
  try {
    const data = await load();
    cache.set(key, { at: Date.now(), data });
    logged.delete(key);
    return data;
  } catch (error) {
    if (!logged.has(key)) {
      logged.add(key);
      console.error(`[xplore360Properties] ${key}:`, (error as Error).message);
    }
    const stale = hit && hit.data != null ? (hit.data as T) : null;
    cache.set(key, { at: Date.now(), data: stale, failed: true });
    return stale;
  }
}

async function request(path: string): Promise<{ status: number; body: any }> {
  const base = (process.env.XPLORE360_SHOWCASE_URL || "").replace(/\/+$/, "");
  const key = process.env.XPLORE360_SHOWCASE_KEY || "";
  if (!base || !key) throw new Error("XPLORE360_SHOWCASE_URL/KEY não configurados");
  const res = await fetch(`${base}${path}`, {
    headers: { "x-showcase-key": key },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (res.status === 404) return { status: 404, body: null };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { status: res.status, body: await res.json() };
}

export async function fetchPropertiesList(channel: PropertiesChannel): Promise<LegacyPropertyListItem[]> {
  const out = await cached(`list:${channel}`, async () => {
    const { body } = await request(`/properties/list?channel=${channel}`);
    return ((body?.items ?? []) as PublicPropertyListItem[]).map((i) => toLegacyPropertyListItem(i, channel));
  });
  return out ?? [];
}

export async function fetchPropertyItem(slug: string): Promise<PublicPropertyItem | null> {
  return cached(`item:${slug}`, async () => {
    const { status, body } = await request(`/properties/item/${encodeURIComponent(slug)}`);
    return status === 404 ? null : ((body?.item ?? null) as PublicPropertyItem | null);
  });
}

export async function fetchPropertyDetail(slug: string) {
  const item = await fetchPropertyItem(slug);
  return item ? toLegacyPropertyDetail(item) : null;
}

// Playlist da TV: mais recentes primeiro.
export async function fetchPropertiesForTv() {
  const items = await fetchPropertiesList("tv");
  return [...items]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      country: p.country,
      xp: p.xp,
      max_guests: p.max_guests,
      bedrooms: p.bedrooms,
      primary_image: p.primary_image,
    }));
}

// roomsSummary/listWithBeds recebem o code; acha o slug na lista do site e, se faltar, na da TV.
async function itemByCode(code: number): Promise<PublicPropertyItem | null> {
  for (const channel of ["site", "tv"] as const) {
    const found = (await fetchPropertiesList(channel)).find((p) => p.id === code);
    if (found) return fetchPropertyItem(found.slug);
  }
  return null;
}

export async function getRoomsSummaryFor(code: number) {
  const item = await itemByCode(code);
  return roomsSummary(
    (item?.rooms ?? []).map((r) => ({ roomTypeName: r.room_type_name, roomTypeIcon: r.room_type_icon, beds: r.beds })),
  );
}

export async function getRoomsWithBedsFor(code: number) {
  const item = await itemByCode(code);
  return item ? toLegacyRoomsWithBeds(item) : [];
}
