import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSlides, resetSlidesCache, toLegacySlide } from "../xplore360Slides";

const item = (over: Record<string, unknown> = {}) => ({
  id: "u1", title: "Santorini", subtitle: "Pôr do sol", image_url: "https://img/a.jpg", sort: 0,
  created_at: "2026-03-10T00:15:23Z", updated_at: "2026-03-10T00:15:23Z", ...over,
});

describe("toLegacySlide", () => {
  it("mapeia para o formato do heroSlides", () => {
    expect(toLegacySlide(item(), 0, "site")).toEqual({
      id: 1, imageUrl: "https://img/a.jpg", title: "Santorini", subtitle: "Pôr do sol", order: 0, isActive: 1,
      mostrarNoSite: 1, mostrarNaTv: 0, createdAt: "2026-03-10T00:15:23Z", updatedAt: "2026-03-10T00:15:23Z",
    });
    expect(toLegacySlide(item({ subtitle: null }), 2, "tv")).toMatchObject({ id: 3, subtitle: null, mostrarNoSite: 0, mostrarNaTv: 1 });
  });
});

describe("fetchSlides", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetSlidesCache();
  });
  const env = () => {
    process.env.XPLORE360_SHOWCASE_URL = "https://x.test/functions/v1/showcase-public";
    process.env.XPLORE360_SHOWCASE_KEY = "k";
  };

  it("mantém a ordem da API e usa cache de 60 s por canal", async () => {
    env();
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true, status: 200,
      json: async () => ({ items: url.includes("channel=tv") ? [item({ title: "T" })] : [item({ title: "B", sort: 0 }), item({ title: "A", sort: 1 })] }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await fetchSlides("site")).map((s) => s.title)).toEqual(["B", "A"]);
    expect((await fetchSlides("site")).map((s) => s.title)).toEqual(["B", "A"]);
    expect((await fetchSlides("tv")).map((s) => s.title)).toEqual(["T"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://x.test/functions/v1/showcase-public/slides/list?channel=site");
  });

  it("falha do xplore360 devolve lista vazia, sem quebrar", async () => {
    env();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await fetchSlides("site")).toEqual([]);
    spy.mockRestore();
  });
});
