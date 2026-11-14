import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPropertiesList,
  fetchPropertyItem,
  getRoomsSummaryFor,
  getRoomsWithBedsFor,
  groupByCityCountry,
  pickFeatured,
  resetPropertiesCache,
  roomsSummary,
  toLegacyPropertyDetail,
  toLegacyPropertyListItem,
  toLegacyRoomsWithBeds,
} from "../xplore360Properties";

const listItem = (over: any = {}): any => ({
  code: 7,
  slug: "casa-mar",
  name: "Casa Mar",
  city: "Balneário Camboriú",
  state_region: "SC",
  country: "Brasil",
  max_guests: 6,
  bedrooms: 3,
  beds: 4,
  bathrooms: 2,
  area_m2: 90,
  xp: 100,
  is_featured: false,
  primary_image: "https://x/a.jpg",
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-02T00:00:00Z",
  ...over,
});

const detail = (over: any = {}): any => ({
  ...listItem(),
  description_short: "curta",
  description_full: "longa",
  address_street: "Rua A",
  address_number: "10",
  neighborhood: "Centro",
  postal_code: "88330-000",
  latitude: -26.9,
  longitude: -48.6,
  images: [{ url: "https://x/1.jpg" }, { url: "https://x/2.jpg" }],
  amenities: [
    { name: "Wi-Fi", icon: "wifi" },
    { name: "Piscina", icon: "pool" },
  ],
  rooms: [
    {
      name: "Suíte 1",
      room_type_name: "Quarto",
      room_type_icon: "bed",
      photo_url: "https://x/q.jpg",
      sort: 0,
      beds: [{ bed_type_name: "Casal", sleeps: 2, quantity: 1 }],
    },
    { name: "Sala", room_type_name: "Sala", room_type_icon: "sofa", photo_url: null, sort: 1, beds: [] },
    {
      name: "Suíte 2",
      room_type_name: "Quarto",
      room_type_icon: "bed",
      photo_url: null,
      sort: 2,
      beds: [{ bed_type_name: "Solteiro", sleeps: 1, quantity: 2 }],
    },
  ],
  ...over,
});

describe("adaptadores", () => {
  it("toLegacyPropertyListItem usa code como id e marca canais", () => {
    const l = toLegacyPropertyListItem(listItem(), "site");
    expect(l).toMatchObject({ id: 7, slug: "casa-mar", active: true, mostrarNoSite: true, mostrarNaTv: false });
    expect(toLegacyPropertyListItem(listItem(), "tv").mostrarNaTv).toBe(true);
  });

  it("item sem foto: primary_image vazio", () => {
    expect(toLegacyPropertyListItem(listItem({ primary_image: null }), "site").primary_image).toBe("");
  });

  it("groupByCityCountry agrupa e ordena por cidade e nome", () => {
    const g = groupByCityCountry([
      toLegacyPropertyListItem(listItem({ code: 1, name: "B" }), "site"),
      toLegacyPropertyListItem(listItem({ code: 2, name: "A" }), "site"),
      toLegacyPropertyListItem(listItem({ code: 3, name: "C", city: "Arraial" }), "site"),
    ]);
    expect(Object.keys(g)).toEqual(["Arraial, Brasil", "Balneário Camboriú, Brasil"]);
    expect(g["Balneário Camboriú, Brasil"].map((p: any) => p.name)).toEqual(["A", "B"]);
  });

  it("pickFeatured: 2 destaques + 5 outros devolve 6 com os destaques", () => {
    const items = [
      ...[1, 2].map((c) => toLegacyPropertyListItem(listItem({ code: c, is_featured: true }), "site")),
      ...[3, 4, 5, 6, 7].map((c) => toLegacyPropertyListItem(listItem({ code: c }), "site")),
    ];
    const out = pickFeatured(items, () => 0.5);
    expect(out).toHaveLength(6);
    expect(out.filter((p: any) => p.is_featured)).toHaveLength(2);
    expect(new Set(out.map((p: any) => p.id)).size).toBe(6);
  });

  it("pickFeatured: 3 itens devolve 3", () => {
    const items = [1, 2, 3].map((c) => toLegacyPropertyListItem(listItem({ code: c }), "site"));
    expect(pickFeatured(items)).toHaveLength(3);
  });

  it("toLegacyPropertyDetail mapeia imagens e comodidades", () => {
    const d = toLegacyPropertyDetail(detail());
    expect(d.images[0]).toEqual({ id: 1, image_url: "https://x/1.jpg" });
    expect(d.amenities.map((a: any) => a.name)).toEqual(["Wi-Fi", "Piscina"]);
    expect(d.amenities[1].id).toBe(2);
    expect(d).toMatchObject({ id: 7, description_short: "curta", address_street: "Rua A", latitude: -26.9 });
  });

  it("toLegacyRoomsWithBeds tira o espaço sem cama", () => {
    const r = toLegacyRoomsWithBeds(detail());
    expect(r.map((x: any) => x.name)).toEqual(["Suíte 1", "Suíte 2"]);
    expect(r[0]).toMatchObject({
      roomTypeName: "Quarto",
      sleepingPhoto: "https://x/q.jpg",
      beds: [{ quantity: 1, bedTypeName: "Casal", sleepsCount: 2 }],
    });
    expect(r[1].sleepingPhoto).toBeNull();
  });

  it("roomsSummary: mesma regra do xplore360", () => {
    const s = roomsSummary([
      { roomTypeName: "Quarto", roomTypeIcon: "bed", beds: [{ quantity: 1 }] },
      { roomTypeName: "Sala", roomTypeIcon: "sofa", beds: [] },
      { roomTypeName: "Quarto", roomTypeIcon: "bed", beds: [{ quantity: 2 }, { quantity: 1 }] },
    ]);
    expect(s).toEqual({
      rooms_summary: [
        { name: "Quarto", icon: "bed", total: 2, beds: 4 },
        { name: "Sala", icon: "sofa", total: 1, beds: 0 },
      ],
      total_beds: 4,
    });
  });
});

describe("fetch", () => {
  const ok = (body: any) => ({ ok: true, status: 200, json: async () => body });
  beforeEach(() => {
    resetPropertiesCache();
    process.env.XPLORE360_SHOWCASE_URL = "https://sb.example/functions/v1/showcase-public/";
    process.env.XPLORE360_SHOWCASE_KEY = "k";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("lista com canal e chave no header; cache de 60 s", async () => {
    vi.useFakeTimers();
    const f = vi.fn().mockResolvedValue(ok({ items: [listItem()] }));
    vi.stubGlobal("fetch", f);
    const out = await fetchPropertiesList("site");
    expect(out[0].id).toBe(7);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://sb.example/functions/v1/showcase-public/properties/list?channel=site");
    expect(init.headers["x-showcase-key"]).toBe("k");
    await fetchPropertiesList("site");
    expect(f).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(61_000);
    await fetchPropertiesList("site");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("erro: devolve o cache anterior ou []; cache negativo de 15 s", async () => {
    vi.useFakeTimers();
    const f = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    vi.stubGlobal("fetch", f);
    expect(await fetchPropertiesList("tv")).toEqual([]);
    await fetchPropertiesList("tv");
    expect(f).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(16_000);
    await fetchPropertiesList("tv");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("item 404 devolve null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));
    expect(await fetchPropertyItem("nao-existe")).toBeNull();
  });

  it("roomsSummary e quartos por code achando o slug na lista (site, depois tv)", async () => {
    const f = vi.fn(async (url: string) => {
      if (url.includes("/properties/list?channel=site")) return ok({ items: [] });
      if (url.includes("/properties/list?channel=tv")) return ok({ items: [listItem()] });
      if (url.endsWith("/properties/item/casa-mar")) return ok({ item: detail() });
      return { ok: false, status: 404, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", f);
    const s = await getRoomsSummaryFor(7);
    expect(s.total_beds).toBe(3);
    const r = await getRoomsWithBedsFor(7);
    expect(r).toHaveLength(2);
    expect(await getRoomsWithBedsFor(999)).toEqual([]);
  });
});
