// Pedido de cotação do site enviado ao form-submit do xplore360 (modo semântico: `answers`).
// Usa XPLORE360_SHOWCASE_URL/KEY (a URL das funções sai da URL da vitrine) e XPLORE360_QUOTE_FORM.

/** Campos do formulário do site (nomes herdados do formulário antigo). */
export interface SiteQuoteInput {
  campoNome: string;
  campoCelular: string;
  campoEmail?: string;
  campoOrigem: string;
  campoDestino: string;
  campoDataInicial?: string;
  campoDataFinal?: string;
  campoPassageiroAdulto?: number;
  campoPassageiroCrianca?: number;
  campoPassageiroBebe?: number;
  campoFlexibilidade?: string;
  campoMalaDespachada?: number;
  campoServicos?: string[];
  campoCupomDesconto?: string;
  campoObservacao?: string;
  /** Classe */
  campoAdicional_4?: string;
  /** Motivo */
  campoAdicional_1?: string;
  /** Urgência */
  campoAdicional_2?: string;
  /** Investimento médio */
  campoAdicional_3?: string;
}

export type QuoteTracking = Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term", string>>;

// O formulário do site é um pedido de viagem com aéreo: "flight" entra sempre.
const SERVICE_KEYS: Record<string, string> = {
  H: "hotel", T: "transfer", P: "tours", S: "insurance", C: "cruise", R: "itinerary",
};
const URGENCY: Record<string, string> = { urgente: "urgent", normal: "normal", flexível: "flexible", flexivel: "flexible" };

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function buildQuoteBody(input: SiteQuoteInput, formSlug: string, tracking: QuoteTracking = {}) {
  const services = ["flight", ...(input.campoServicos ?? []).map((s) => SERVICE_KEYS[s]).filter(Boolean)];
  const trip: Record<string, unknown> = {
    destination: clean(input.campoDestino),
    adults: input.campoPassageiroAdulto ?? 1,
    children: input.campoPassageiroCrianca ?? 0,
    infants: input.campoPassageiroBebe ?? 0,
    services: Array.from(new Set(services)),
  };
  if (clean(input.campoOrigem)) trip.origin = clean(input.campoOrigem);
  if (clean(input.campoDataInicial)) trip.departure_date = clean(input.campoDataInicial);
  if (clean(input.campoDataFinal)) trip.return_date = clean(input.campoDataFinal);

  const answers: Record<string, unknown> = {
    name: clean(input.campoNome).replace(/\s+/g, " "),
    phone: clean(input.campoCelular),
    trip,
  };
  if (clean(input.campoEmail)) answers.email = clean(input.campoEmail);
  const urgency = URGENCY[clean(input.campoAdicional_2).toLowerCase()];
  if (urgency) answers.urgency = urgency;
  if (clean(input.campoAdicional_3)) answers.budget = clean(input.campoAdicional_3);

  const extras: { label: string; value: string }[] = [];
  const add = (label: string, value: string) => value && extras.push({ label, value });
  if (input.campoFlexibilidade) add("Datas flexíveis", input.campoFlexibilidade === "S" ? "Sim" : "Não");
  if ((input.campoMalaDespachada ?? 0) > 0) add("Malas despachadas", String(input.campoMalaDespachada));
  add("Classe", clean(input.campoAdicional_4));
  add("Motivo", clean(input.campoAdicional_1));
  add("Cupom", clean(input.campoCupomDesconto));
  add("Observação", clean(input.campoObservacao));
  if (extras.length) answers.extras = extras;

  const utm = Object.fromEntries(Object.entries(tracking).filter(([, v]) => typeof v === "string" && v));
  return { form_slug: formSlug, answers, tracking: utm, hp: "" };
}

/** URL das funções: a da vitrine sem o último segmento (…/functions/v1/showcase-public). */
export function functionsBase(): string {
  return (process.env.XPLORE360_SHOWCASE_URL || "").replace(/\/+$/, "").replace(/\/[^/]+$/, "");
}

export async function submitQuote(
  input: SiteQuoteInput,
  clientIp: string,
  tracking: QuoteTracking = {},
): Promise<{ locator_code: string | null }> {
  const key = process.env.XPLORE360_SHOWCASE_KEY || "";
  const form = process.env.XPLORE360_QUOTE_FORM || "";
  const base = functionsBase();
  if (!base || !key || !form) throw new Error("XPLORE360_SHOWCASE_URL/KEY/QUOTE_FORM não configurados");
  const res = await fetch(`${base}/form-submit`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-showcase-key": key, "x-client-ip": clientIp },
    body: JSON.stringify(buildQuoteBody(input, form, tracking)),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) throw new Error(body?.error || `HTTP ${res.status}`);
  return { locator_code: body?.locator_code ?? null };
}
