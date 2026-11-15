import { afterEach, describe, expect, it, vi } from "vitest";
import { buildQuoteBody, clientIpFrom, publicErrorMessage, UpstreamError, functionsBase, submitQuote, type SiteQuoteInput } from "../xplore360Quote";

const input = (over: Partial<SiteQuoteInput> = {}): SiteQuoteInput => ({
  campoNome: "Ana  Silva", campoCelular: "+5511999998888", campoEmail: "", campoOrigem: "São Paulo",
  campoDestino: "Lisboa", campoDataInicial: "2027-01-10", campoDataFinal: "2027-01-20",
  campoPassageiroAdulto: 2, campoPassageiroCrianca: 1, campoPassageiroBebe: 0,
  campoFlexibilidade: "S", campoMalaDespachada: 2, campoServicos: ["H", "R"],
  campoCupomDesconto: "", campoObservacao: "Janela", campoAdicional_4: "Executiva",
  campoAdicional_1: "Lazer", campoAdicional_2: "Urgente", campoAdicional_3: "R$ 5.000,00", ...over,
});

describe("buildQuoteBody", () => {
  it("converte os campos do formulário em respostas semânticas", () => {
    const body = buildQuoteBody(input(), "meu-form", { utm_source: "ig" });
    expect(body).toEqual({
      form_slug: "meu-form",
      hp: "",
      tracking: { utm_source: "ig" },
      answers: {
        name: "Ana Silva", phone: "+5511999998888",
        trip: {
          origin: "São Paulo", destination: "Lisboa", departure_date: "2027-01-10", return_date: "2027-01-20",
          adults: 2, children: 1, infants: 0, services: ["flight", "hotel", "itinerary"],
        },
        urgency: "urgent", budget: "R$ 5.000,00",
        extras: [
          { label: "Datas flexíveis", value: "Sim" }, { label: "Malas despachadas", value: "2" },
          { label: "Classe", value: "Executiva" }, { label: "Motivo", value: "Lazer" },
          { label: "Observação", value: "Janela" },
        ],
      },
    });
  });
  it("omite vazios, mapeia urgência e sempre inclui aéreo", () => {
    const b = buildQuoteBody(input({ campoEmail: "a@x.com", campoServicos: [], campoDataFinal: "", campoFlexibilidade: "N", campoMalaDespachada: 0, campoAdicional_2: "Flexível", campoAdicional_3: "", campoObservacao: "", campoAdicional_4: "", campoAdicional_1: "", campoCupomDesconto: "X1" }), "f", {}) as any;
    expect(b.answers.email).toBe("a@x.com");
    expect(b.answers.urgency).toBe("flexible");
    expect(b.answers.budget).toBeUndefined();
    expect(b.answers.trip.return_date).toBeUndefined();
    expect(b.answers.trip.services).toEqual(["flight"]);
    expect(b.answers.extras).toEqual([{ label: "Datas flexíveis", value: "Não" }, { label: "Cupom", value: "X1" }]);
  });
});

describe("functionsBase", () => {
  it("remove o último segmento da URL da vitrine", () => {
    process.env.XPLORE360_SHOWCASE_URL = "https://x.test/functions/v1/showcase-public/";
    expect(functionsBase()).toBe("https://x.test/functions/v1");
  });
});

describe("submitQuote", () => {
  afterEach(() => vi.unstubAllGlobals());
  const env = () => {
    process.env.XPLORE360_SHOWCASE_URL = "https://x.test/functions/v1/showcase-public";
    process.env.XPLORE360_SHOWCASE_KEY = "k";
    process.env.XPLORE360_QUOTE_FORM = "cotacao";
  };
  it("envia com chave e IP e devolve o código", async () => {
    env();
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, quote_id: "q", locator_code: "AB12CD" }) });
    vi.stubGlobal("fetch", f);
    expect(await submitQuote(input(), "1.2.3.4")).toEqual({ locator_code: "AB12CD" });
    expect(f.mock.calls[0][0]).toBe("https://x.test/functions/v1/form-submit");
    expect(f.mock.calls[0][1].headers).toMatchObject({ "x-showcase-key": "k", "x-client-ip": "1.2.3.4" });
    expect(JSON.parse(f.mock.calls[0][1].body).form_slug).toBe("cotacao");
  });
  it("sem código devolve null; erro da API vira exceção", async () => {
    env();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    expect(await submitQuote(input(), "1.2.3.4")).toEqual({ locator_code: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ success: false, error: "Telefone inválido" }) }));
    await expect(submitQuote(input(), "1.2.3.4")).rejects.toThrow("Telefone inválido");
  });
});

describe("clientIpFrom", () => {
  it("usa a última entrada do XFF e ignora a primeira forjada", () => {
    expect(clientIpFrom("6.6.6.6, 9.9.9.9", "10.0.0.1")).toBe("9.9.9.9");
    expect(clientIpFrom(["6.6.6.6", "9.9.9.9"], undefined)).toBe("9.9.9.9");
  });
  it("sem XFF usa o socket; inválido vira undefined", () => {
    expect(clientIpFrom(undefined, "::ffff:1.2.3.4")).toBe("1.2.3.4");
    expect(clientIpFrom(undefined, "2001:db8::1")).toBe("2001:db8::1");
    expect(clientIpFrom("1.1.1.1, lixo", undefined)).toBeUndefined();
    expect(clientIpFrom("999.1.1.1", undefined)).toBeUndefined();
    expect(clientIpFrom(undefined, undefined)).toBeUndefined();
  });
});

describe("publicErrorMessage", () => {
  it("genérico, com 429 próprio", () => {
    expect(publicErrorMessage(new UpstreamError("Telefone inválido em x", 400))).toBe("Não foi possível enviar. Tente de novo.");
    expect(publicErrorMessage(new UpstreamError("x", 429))).toBe("Muitas tentativas. Tente mais tarde.");
    expect(publicErrorMessage(new Error("boom"))).toBe("Não foi possível enviar. Tente de novo.");
  });
});
