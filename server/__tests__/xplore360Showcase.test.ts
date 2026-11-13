import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchShowcase,
  fetchTaxonomy,
  resetShowcaseCache,
  showcaseSummary,
  toLegacyViagem,
} from "../xplore360Showcase";

const flight = (over: any = {}) => ({
  type: "flight",
  moments: [],
  flight: { segments: [{ origin: { iata: "GRU", city: "São Paulo", name: "Guarulhos" } }] },
  ...over,
});
const hotel = (over: any = {}) => ({
  type: "hotel",
  moments: [],
  hotel: { name: "Pousada X", rooms: [{ category: "Suíte" }] },
  ...over,
});

const item = (over: any = {}): any => ({
  code: "PK-001",
  slug: "praia",
  kind: "package",
  title: "Praia",
  summary: null,
  description: "Desc",
  price_total: 3000,
  currency: "BRL",
  installments_count: 10,
  installment_value: 300,
  has_interest: false,
  xp_points: 50,
  valid_until: "2027-01-10T00:00:00Z",
  cover_url: "https://x/y.jpg",
  media: [],
  categories: [{ id: "uuid-c1", name: "Praia" }],
  tags: [{ id: "uuid-t1", name: "All Inclusive" }],
  package: {
    destination: "Maceió",
    departure_date: "2027-02-01",
    return_date: "2027-02-08",
    adults: 2,
    children: 0,
    services: [flight(), hotel()],
  },
  updated_at: "2026-11-01T00:00:00Z",
  ...over,
});

describe("showcaseSummary", () => {
  it("usa cidade do primeiro trecho do voo, hotel e quarto", () => {
    expect(showcaseSummary([flight(), hotel()])).toEqual({
      origin: "São Paulo",
      lodging: "Pousada X",
      roomType: "Suíte",
    });
  });
  it("cai para IATA quando não há cidade", () => {
    const f = flight({ flight: { segments: [{ origin: { iata: "GRU", city: "" } }] } });
    expect(showcaseSummary([f]).origin).toBe("GRU");
  });
  it("sem origem do trecho, usa location do primeiro momento do voo", () => {
    const f = flight({ flight: { segments: [] }, moments: [{ location: " Campinas " }] });
    expect(showcaseSummary([f]).origin).toBe("Campinas");
  });
  it("ignora serviços inativos", () => {
    const f = flight({ status: "cancelled" });
    expect(showcaseSummary([f, hotel({ status: "removed" })])).toEqual({
      origin: null,
      lodging: null,
      roomType: null,
    });
  });
  it("sem serviços tudo é null", () => {
    expect(showcaseSummary([])).toEqual({ origin: null, lodging: null, roomType: null });
  });
  it("hotel sem quartos: roomType null", () => {
    expect(showcaseSummary([hotel({ hotel: { name: "H", rooms: [] } })]).roomType).toBeNull();
  });
});

describe("toLegacyViagem", () => {
  it("mapeia os campos que o front usa", () => {
    const v = toLegacyViagem(item(), "site");
    expect(v).toMatchObject({
      id: "PK-001",
      titulo: "Praia",
      slug: "praia",
      descricao: "Desc",
      tipoViagem: "pacote",
      origem: "São Paulo",
      hospedagem: "Pousada X",
      tipoQuarto: "Suíte",
      dataIda: "2027-02-01",
      dataVolta: "2027-02-08",
      dataExpiracao: "2027-01-10",
      quantidadePessoas: 2,
      valorTotal: 3000,
      quantidadeParcelas: 10,
      valorParcela: 300,
      temJuros: false,
      xp: 50,
      imagemUrl: "https://x/y.jpg",
      ativo: true,
      mostrarNoSite: true,
      mostrarNaTv: false,
      categorias: [{ id: "uuid-c1", nome: "Praia" }],
      destaques: [{ id: "uuid-t1", nome: "All Inclusive" }],
    });
  });
  it("sem foto: imagemUrl vazio; canal tv marca mostrarNaTv", () => {
    const v = toLegacyViagem(item({ cover_url: null, valid_until: null }), "tv");
    expect(v.imagemUrl).toBe("");
    expect(v.dataExpiracao).toBeNull();
    expect(v.mostrarNaTv).toBe(true);
    expect(v.mostrarNoSite).toBe(false);
  });
  it("sem serviços: origem e hospedagem null", () => {
    const v = toLegacyViagem(item({ package: { ...item().package, services: [] } }), "site");
    expect(v.origem).toBeNull();
    expect(v.hospedagem).toBeNull();
    expect(v.tipoQuarto).toBeNull();
  });
  it("soma adultos e crianças", () => {
    const v = toLegacyViagem(item({ package: { ...item().package, adults: 2, children: 3 } }), "site");
    expect(v.quantidadePessoas).toBe(5);
  });
});

describe("fetchShowcase", () => {
  const ok = (body: any) => ({ ok: true, status: 200, json: async () => body });
  beforeEach(() => {
    resetShowcaseCache();
    process.env.XPLORE360_SHOWCASE_URL = "https://sb.example/functions/v1/showcase-public";
    process.env.XPLORE360_SHOWCASE_KEY = "k";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("chama /list com canal e chave no header, e converte", async () => {
    const f = vi.fn().mockResolvedValue(ok({ agency: {}, items: [item()] }));
    vi.stubGlobal("fetch", f);
    const out = await fetchShowcase("site");
    expect(out[0].id).toBe("PK-001");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://sb.example/functions/v1/showcase-public/list?channel=site&kind=package");
    expect(init.headers["x-showcase-key"]).toBe("k");
  });

  it("cache de 60 s", async () => {
    vi.useFakeTimers();
    const f = vi.fn().mockResolvedValue(ok({ items: [item()] }));
    vi.stubGlobal("fetch", f);
    await fetchShowcase("site");
    await fetchShowcase("site");
    expect(f).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(61_000);
    await fetchShowcase("site");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("erro devolve o cache anterior; sem cache devolve []", async () => {
    vi.useFakeTimers();
    const f = vi
      .fn()
      .mockResolvedValueOnce(ok({ items: [item()] }))
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    vi.stubGlobal("fetch", f);
    await fetchShowcase("site");
    vi.advanceTimersByTime(61_000);
    const out = await fetchShowcase("site");
    expect(out.map((v) => v.id)).toEqual(["PK-001"]);
    expect(await fetchShowcase("tv")).toEqual([]);
  });

  it("fetch que lança também cai no cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("rede")));
    expect(await fetchShowcase("site")).toEqual([]);
  });

  it("taxonomia vira { id, nome }", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        ok({ categories: [{ id: "c1", name: "Praia" }], tags: [{ id: "t1", name: "Aéreo" }] }),
      ),
    );
    expect(await fetchTaxonomy("categories")).toEqual([{ id: "c1", nome: "Praia" }]);
    expect(await fetchTaxonomy("tags")).toEqual([{ id: "t1", nome: "Aéreo" }]);
  });
});
