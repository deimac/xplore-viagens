import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchReviews, resetReviewsCache, submitReview, toLegacyReview } from "../xplore360Reviews";
import { signReviewAuthor, readReviewAuthor } from "../reviewAuthor";

const item = (over: Record<string, unknown> = {}) => ({
  id: "r1", author_name: "Ana", author_avatar_url: "https://img/a.jpg", rating: 5,
  comment: "Viagem perfeita", created_at: "2026-03-10T00:15:23Z", email: "ana@x.com", ...over,
});

describe("toLegacyReview", () => {
  it("mapeia para o formato do site e não expõe e-mail", () => {
    const out = toLegacyReview(item());
    expect(out).toEqual({
      id: "r1", rating: 5, comment: "Viagem perfeita", createdAt: "2026-03-10T00:15:23Z",
      author: { name: "Ana", avatarUrl: "https://img/a.jpg" },
    });
    expect(JSON.stringify(out)).not.toContain("ana@x.com");
  });
});

describe("adaptador de avaliações", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetReviewsCache();
  });
  const env = () => {
    process.env.XPLORE360_SHOWCASE_URL = "https://x.test/functions/v1/showcase-public";
    process.env.XPLORE360_SHOWCASE_KEY = "k";
  };

  it("lê reviews/list com a chave e usa cache", async () => {
    env();
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [item()] }) });
    vi.stubGlobal("fetch", f);
    expect(await fetchReviews()).toHaveLength(1);
    await fetchReviews();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe("https://x.test/functions/v1/showcase-public/reviews/list");
    expect(f.mock.calls[0][1].headers["x-showcase-key"]).toBe("k");
  });

  it("em falha devolve lista vazia", async () => {
    env();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("x")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await fetchReviews()).toEqual([]);
  });

  it("envia avaliação para site-review-submit", async () => {
    env();
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, id: "n1" }) });
    vi.stubGlobal("fetch", f);
    await submitReview({ provider: "google", providerId: "g1", name: "Ana", email: "a@x.com", avatarUrl: null, rating: 5, comment: "Muito bom mesmo" });
    expect(f.mock.calls[0][0]).toBe("https://x.test/functions/v1/site-review-submit");
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ provider: "google", provider_id: "g1", avatar_url: null, rating: 5 });
  });

  it("falha do envio vira erro com status", async () => {
    env();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: "limite" }) }));
    await expect(submitReview({ provider: "google", providerId: "g1", name: "A", email: "a@x.com", avatarUrl: null, rating: 5, comment: "Muito bom mesmo" })).rejects.toThrow("limite");
  });
});

describe("cookie do autor verificado", () => {
  const author = { provider: "google" as const, providerId: "g1", name: "Ana", email: "a@x.com", avatarUrl: null, authorId: 7 };
  it("assina e lê de volta", async () => {
    const token = await signReviewAuthor(author);
    expect(await readReviewAuthor(`a=b; review_author=${token}`)).toMatchObject({ providerId: "g1", authorId: 7 });
  });
  it("sem cookie ou adulterado recusa", async () => {
    expect(await readReviewAuthor(undefined)).toBeNull();
    const token = await signReviewAuthor(author);
    expect(await readReviewAuthor(`review_author=${token}x`)).toBeNull();
  });
});
