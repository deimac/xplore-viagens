// Avaliações do site no xplore360: leitura pública (sem e-mail) e envio para moderação.
// Ativado pela mesma SHOWCASE_SOURCE=xplore360. Usa XPLORE360_SHOWCASE_URL/KEY.
import { functionsBase, UpstreamError } from "./xplore360Quote";

export interface PublicReview {
  id: string;
  author_name: string;
  author_avatar_url: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export interface LegacyReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: { name: string; avatarUrl: string | null };
}

/** Formato usado pelas seções do site; só campos públicos (nunca e-mail). */
export function toLegacyReview(r: PublicReview): LegacyReview {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    author: { name: r.author_name, avatarUrl: r.author_avatar_url ?? null },
  };
}

const TTL_MS = 60_000;
const ERROR_TTL_MS = 15_000;
const FETCH_TIMEOUT_MS = 5_000;
let entry: { at: number; data: LegacyReview[]; failed?: boolean } | null = null;
let logged = false;

export function resetReviewsCache() {
  entry = null;
  logged = false;
}

async function load(): Promise<LegacyReview[]> {
  const base = (process.env.XPLORE360_SHOWCASE_URL || "").replace(/\/+$/, "");
  const key = process.env.XPLORE360_SHOWCASE_KEY || "";
  if (!base || !key) throw new Error("XPLORE360_SHOWCASE_URL/KEY não configurados");
  const res = await fetch(`${base}/reviews/list`, {
    headers: { "x-showcase-key": key },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return ((body?.items ?? []) as PublicReview[]).map(toLegacyReview);
}

/** Em falha devolve o último resultado bom ou [], sem quebrar a seção. */
export async function fetchReviews(): Promise<LegacyReview[]> {
  if (entry && Date.now() - entry.at < (entry.failed ? ERROR_TTL_MS : TTL_MS)) return entry.data;
  try {
    const data = await load();
    entry = { at: Date.now(), data };
    logged = false;
    return data;
  } catch (error) {
    if (!logged) {
      logged = true;
      console.error("[xplore360Reviews]", (error as Error).message);
    }
    const stale = entry?.data ?? [];
    entry = { at: Date.now(), data: stale, failed: true };
    return stale;
  }
}

export interface ReviewSubmission {
  provider: "google" | "facebook";
  providerId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  rating: number;
  comment: string;
}

export async function submitReview(r: ReviewSubmission): Promise<void> {
  const key = process.env.XPLORE360_SHOWCASE_KEY || "";
  const base = functionsBase();
  if (!base || !key) throw new Error("XPLORE360_SHOWCASE_URL/KEY não configurados");
  const res = await fetch(`${base}/site-review-submit`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-showcase-key": key },
    body: JSON.stringify({
      provider: r.provider, provider_id: r.providerId, name: r.name, email: r.email,
      avatar_url: r.avatarUrl, rating: r.rating, comment: r.comment,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) throw new UpstreamError(body?.error || `HTTP ${res.status}`, res.status);
}
