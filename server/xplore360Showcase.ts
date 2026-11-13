// Vitrine do xplore360: viagens, categorias e destaques do site/TV lidos do endpoint público.
// Ativado por SHOWCASE_SOURCE=xplore360 (padrão: mysql).

export type ShowcaseChannel = "site" | "tv";

export function isXplore360Source(): boolean {
  return (process.env.SHOWCASE_SOURCE || "mysql").trim().toLowerCase() === "xplore360";
}

export const SHOWCASE_MOVED_MESSAGE = "Cadastro movido para o xplore360";

type Ref = { id: string; name: string };

export interface PublicShowcaseItem {
  code: string;
  slug: string;
  kind: string;
  title: string;
  summary: string | null;
  description: string | null;
  price_total: number | null;
  currency: string;
  installments_count: number | null;
  installment_value: number | null;
  has_interest: boolean;
  xp_points: number | null;
  valid_until: string | null;
  cover_url: string | null;
  media: unknown[];
  categories: Ref[];
  tags: Ref[];
  package: {
    destination: string | null;
    departure_date: string | null;
    return_date: string | null;
    adults: number;
    children: number;
    services: any[];
  } | null;
  updated_at: string;
}

export interface LegacyViagemOut {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  tipoViagem: string;
  origem: string | null;
  hospedagem: string | null;
  tipoQuarto: string | null;
  dataIda: string | null;
  dataVolta: string | null;
  dataExpiracao: string | null;
  quantidadePessoas: number;
  valorTotal: number;
  quantidadeParcelas: number | null;
  valorParcela: number | null;
  temJuros: boolean;
  xp: number;
  imagemUrl: string;
  categorias: { id: string; nome: string }[];
  destaques: { id: string; nome: string }[];
  ativo: boolean;
  mostrarNoSite: boolean;
  mostrarNaTv: boolean;
}

export interface ShowcaseSummary {
  origin: string | null;
  lodging: string | null;
  roomType: string | null;
}

const isActive = (s: any) => !s?.status || s.status === "active";

// Cópia mínima de packageSummary do xplore360 (origem, hotel e quarto).
export function showcaseSummary(allServices: any[]): ShowcaseSummary {
  const services = (allServices || []).filter(isActive);
  const flight = services.find((s) => s.type === "flight");
  const origin0 = flight?.flight?.segments?.[0]?.origin;
  const origin: string | null = origin0
    ? origin0.city || origin0.iata || null
    : flight?.moments?.[0]?.location?.trim() || null;
  const hotel = services.find((s) => s.type === "hotel")?.hotel;
  return {
    origin,
    lodging: hotel?.name || null,
    roomType: hotel?.rooms?.[0]?.category || null,
  };
}

const ymd = (v: string | null | undefined): string | null => {
  const m = typeof v === "string" ? v.match(/^(\d{4}-\d{2}-\d{2})/) : null;
  return m ? m[1] : null;
};

export function toLegacyViagem(item: PublicShowcaseItem, channel: ShowcaseChannel): LegacyViagemOut {
  const pkg = item.package;
  const summary = showcaseSummary(pkg?.services ?? []);
  return {
    id: item.code,
    titulo: item.title,
    slug: item.slug,
    descricao: item.description ?? item.summary ?? "",
    tipoViagem: "pacote",
    origem: summary.origin,
    hospedagem: summary.lodging,
    tipoQuarto: summary.roomType,
    dataIda: ymd(pkg?.departure_date),
    dataVolta: ymd(pkg?.return_date),
    dataExpiracao: ymd(item.valid_until),
    quantidadePessoas: (pkg?.adults ?? 0) + (pkg?.children ?? 0),
    valorTotal: item.price_total != null ? Number(item.price_total) : 0,
    quantidadeParcelas: item.installments_count ?? null,
    valorParcela: item.installment_value != null ? Number(item.installment_value) : null,
    temJuros: !!item.has_interest,
    xp: item.xp_points ?? 0,
    imagemUrl: item.cover_url ?? "",
    categorias: (item.categories ?? []).map((c) => ({ id: c.id, nome: c.name })),
    destaques: (item.tags ?? []).map((t) => ({ id: t.id, nome: t.name })),
    ativo: true,
    mostrarNoSite: channel === "site",
    mostrarNaTv: channel === "tv",
  };
}

const TTL_MS = 60_000;
type Entry = { at: number; data: any };
const cache = new Map<string, Entry>();
const logged = new Set<string>();

export function resetShowcaseCache() {
  cache.clear();
  logged.clear();
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T;
  try {
    const data = await load();
    cache.set(key, { at: Date.now(), data });
    logged.delete(key);
    return data;
  } catch (error) {
    if (!logged.has(key)) {
      logged.add(key);
      console.error(`[xplore360Showcase] ${key}:`, (error as Error).message);
    }
    return hit ? (hit.data as T) : null;
  }
}

async function request(path: string): Promise<any> {
  const base = (process.env.XPLORE360_SHOWCASE_URL || "").replace(/\/+$/, "");
  const key = process.env.XPLORE360_SHOWCASE_KEY || "";
  if (!base || !key) throw new Error("XPLORE360_SHOWCASE_URL/KEY não configurados");
  const res = await fetch(`${base}${path}`, { headers: { "x-showcase-key": key } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchShowcase(channel: ShowcaseChannel): Promise<LegacyViagemOut[]> {
  const out = await cached(`list:${channel}`, async () => {
    const body = await request(`/list?channel=${channel}&kind=package`);
    return ((body?.items ?? []) as PublicShowcaseItem[]).map((i) => toLegacyViagem(i, channel));
  });
  return out ?? [];
}

export async function fetchTaxonomy(which: "categories" | "tags"): Promise<{ id: string; nome: string }[]> {
  const body = await cached("taxonomy", () => request("/taxonomy"));
  return ((body?.[which] ?? []) as Ref[]).map((r) => ({ id: r.id, nome: r.name }));
}
