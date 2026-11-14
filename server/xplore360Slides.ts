// Slides Hero do xplore360: carrossel do site e slides da TV lidos do endpoint público.
// Ativado pela mesma SHOWCASE_SOURCE=xplore360. Usa XPLORE360_SHOWCASE_URL/KEY.

export type SlidesChannel = "site" | "tv";

export interface PublicSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface LegacySlide {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string | null;
  order: number;
  isActive: number;
  mostrarNoSite: number;
  mostrarNaTv: number;
  createdAt: string;
  updatedAt: string;
}

/** Formato da tabela heroSlides; o id é só a chave do front (posição + 1). */
export function toLegacySlide(s: PublicSlide, index: number, channel: SlidesChannel): LegacySlide {
  return {
    id: index + 1,
    imageUrl: s.image_url,
    title: s.title,
    subtitle: s.subtitle ?? null,
    order: s.sort,
    isActive: 1,
    mostrarNoSite: channel === "site" ? 1 : 0,
    mostrarNaTv: channel === "tv" ? 1 : 0,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

const TTL_MS = 60_000;
const ERROR_TTL_MS = 15_000;
const FETCH_TIMEOUT_MS = 5_000;
type Entry = { at: number; data: LegacySlide[]; failed?: boolean };
const cache = new Map<SlidesChannel, Entry>();
let logged = false;

export function resetSlidesCache() {
  cache.clear();
  logged = false;
}

async function load(channel: SlidesChannel): Promise<LegacySlide[]> {
  const base = (process.env.XPLORE360_SHOWCASE_URL || "").replace(/\/+$/, "");
  const key = process.env.XPLORE360_SHOWCASE_KEY || "";
  if (!base || !key) throw new Error("XPLORE360_SHOWCASE_URL/KEY não configurados");
  const res = await fetch(`${base}/slides/list?channel=${channel}`, {
    headers: { "x-showcase-key": key },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return ((body?.items ?? []) as PublicSlide[]).map((s, i) => toLegacySlide(s, i, channel));
}

/** Em falha devolve o último resultado bom ou [], sem quebrar o carrossel. */
export async function fetchSlides(channel: SlidesChannel): Promise<LegacySlide[]> {
  const hit = cache.get(channel);
  if (hit && Date.now() - hit.at < (hit.failed ? ERROR_TTL_MS : TTL_MS)) return hit.data;
  try {
    const data = await load(channel);
    cache.set(channel, { at: Date.now(), data });
    logged = false;
    return data;
  } catch (error) {
    if (!logged) {
      logged = true;
      console.error(`[xplore360Slides] ${channel}:`, (error as Error).message);
    }
    const stale = hit?.data ?? [];
    cache.set(channel, { at: Date.now(), data: stale, failed: true });
    return stale;
  }
}
