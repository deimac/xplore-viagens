/**
 * Extração assistida por IA para o Workspace de Cotações.
 *
 * Recebe texto colado ou imagem (print) e retorna uma proposta estruturada
 * de Peça (com segmentos) para revisão humana antes de salvar.
 *
 * O resultado nunca deve ser tratado como verdade incontestável: a UI
 * sempre apresenta os dados para edição/confirmação.
 *
 * Arquitetura: adapter único hoje (Google Gemini via `invokeLLM`, chamada
 * direta à API do Google AI Studio), mas com uma interface `Extractor`
 * pronta para receber outros provedores e cair em fallback automático no
 * futuro.
 */

import { invokeLLM, type Message } from "./_core/llm";

export interface ExtractedSegmento {
    direcao?: "ida" | "volta" | null;
    ordem: number;
    aeroportoOrigem?: string | null;
    aeroportoDestino?: string | null;
    cidadeOrigem?: string | null;
    cidadeDestino?: string | null;
    saida?: string | null; // ISO datetime
    chegada?: string | null;
    companhia?: string | null;
    numeroVoo?: string | null;
    classe?: string | null;
    bagagem?: string | null;
    duracaoConexaoMinutos?: number | null;
}

export interface ExtractedPeca {
    titulo?: string | null;
    temVolta?: boolean | null;
    origem?: string | null;
    destino?: string | null;
    dataSaida?: string | null;
    dataChegada?: string | null;
    origemVolta?: string | null;
    destinoVolta?: string | null;
    dataSaidaVolta?: string | null;
    dataChegadaVolta?: string | null;
    duracaoMinutos?: number | null;
    duracaoMinutosVolta?: number | null;
    qtdConexoes?: number;
    qtdConexoesVolta?: number;
    companhias?: string | null;
    companhiasVolta?: string | null;
    itemPessoal?: number | null;
    bagagemMao?: number | null;
    bagagemDespachada?: number | null;
    classe?: string | null;
    classeVolta?: string | null;
    observacoes?: string | null;
    segmentos: ExtractedSegmento[];
    confianca?: number | null;
}

const PECA_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        titulo: { type: ["string", "null"] },
        temVolta: { type: ["boolean", "null"] },
        origem: { type: ["string", "null"], description: "Cidade ou aeroporto de origem da peça inteira" },
        destino: { type: ["string", "null"], description: "Cidade ou aeroporto de destino final da peça" },
        dataSaida: { type: ["string", "null"], description: "ISO 8601 sem timezone, ex 2026-06-15T22:35" },
        dataChegada: { type: ["string", "null"] },
        origemVolta: { type: ["string", "null"] },
        destinoVolta: { type: ["string", "null"] },
        dataSaidaVolta: { type: ["string", "null"] },
        dataChegadaVolta: { type: ["string", "null"] },
        duracaoMinutos: { type: ["integer", "null"] },
        duracaoMinutosVolta: { type: ["integer", "null"] },
        qtdConexoes: { type: "integer", minimum: 0 },
        qtdConexoesVolta: { type: ["integer", "null"], minimum: 0 },
        companhias: { type: ["string", "null"], description: "Lista resumida de cias, ex 'Gol, TAP'" },
        companhiasVolta: { type: ["string", "null"] },
        itemPessoal: {
            type: ["integer", "null"],
            minimum: 0,
            description: "Quantidade de item pessoal (mochila/bolsa pequena). Use 1 se incluso e não especificado.",
        },
        bagagemMao: {
            type: ["integer", "null"],
            minimum: 0,
            description: "Quantidade de bagagens de mão (carry-on)",
        },
        bagagemDespachada: {
            type: ["integer", "null"],
            minimum: 0,
            description: "Quantidade de bagagens despachadas (porão)",
        },
        classe: { type: ["string", "null"] },
        classeVolta: { type: ["string", "null"] },
        observacoes: { type: ["string", "null"] },
        segmentos: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    direcao: { type: ["string", "null"], enum: ["ida", "volta", null] },
                    ordem: { type: "integer" },
                    aeroportoOrigem: { type: ["string", "null"], description: "Código IATA 3 letras" },
                    aeroportoDestino: { type: ["string", "null"] },
                    cidadeOrigem: { type: ["string", "null"] },
                    cidadeDestino: { type: ["string", "null"] },
                    saida: { type: ["string", "null"] },
                    chegada: { type: ["string", "null"] },
                    companhia: { type: ["string", "null"] },
                    numeroVoo: { type: ["string", "null"] },
                    classe: { type: ["string", "null"] },
                    bagagem: { type: ["string", "null"] },
                    duracaoConexaoMinutos: { type: ["integer", "null"] },
                },
                required: ["ordem"],
            },
        },
        confianca: { type: ["number", "null"], description: "0 a 1, autoavaliação da extração" },
    },
    required: ["segmentos"],
} as const;

const SYSTEM_PROMPT = `Você é um assistente de extração de dados de voos para um consultor de viagens brasileiro.

Sua tarefa é converter uma cotação de voo (em texto ou imagem) em JSON estruturado seguindo o schema.

Regras:
- Datas/horas devem ser ISO 8601 local (sem timezone), ex: "2026-06-15T22:35".
- Códigos de aeroporto devem ser IATA de 3 letras maiúsculas quando identificáveis.
- "ordem" dos segmentos começa em 0 e é sequencial.
- "qtdConexoes" = quantidade de segmentos - 1.
- Campos não identificáveis devem ser null (não invente).
- Bagagem: informe QUANTIDADES inteiras em itemPessoal, bagagemMao e bagagemDespachada.
  - itemPessoal: mochila/item pessoal (padrão 1 se incluso e não especificado).
  - bagagemMao: malas de mão / carry-on.
  - bagagemDespachada: malas despachadas / porão.
  - Ex.: "1 mala 23kg + 1 mão" → itemPessoal=1, bagagemMao=1, bagagemDespachada=1.
  - Se não houver bagagem inclusa, use 0 nos campos correspondentes.
- Companhia: nome completo se possível (ex: "Gol", "TAP Air Portugal", "Latam").
- Se a imagem/texto tiver múltiplos itinerários distintos (ex: ida e volta separadas), extraia apenas o PRIMEIRO/PRINCIPAL como uma peça única; a peça deve ser unidade indivisível.
- Se houver ida e volta explícitas, você pode preencher campos de volta (origemVolta, destinoVolta, datas/cias/conexoes/classe da volta) e marcar segmentos com direcao.
- "confianca" 0-1: avalie sua certeza da extração.

Responda SEMPRE seguindo estritamente o JSON Schema fornecido.`;

export interface Extractor {
    name: string;
    fromText: (text: string) => Promise<ExtractedPeca>;
    fromImage: (imageDataUrl: string) => Promise<ExtractedPeca>;
}

function normalizeExtractedPeca(parsed: ExtractedPeca): ExtractedPeca {
    if (!Array.isArray(parsed.segmentos)) parsed.segmentos = [];
    return {
        ...parsed,
        itemPessoal: parsed.itemPessoal ?? 1,
        bagagemMao: parsed.bagagemMao ?? 0,
        bagagemDespachada: parsed.bagagemDespachada ?? 0,
    };
}

function parseStructuredOutput(content: unknown): ExtractedPeca {
    const text =
        typeof content === "string"
            ? content
            : Array.isArray(content)
                ? content
                    .map((p: any) => (typeof p === "string" ? p : p?.text ?? ""))
                    .join("")
                : "";
    if (!text) throw new Error("LLM retornou conteúdo vazio");
    try {
        const parsed = JSON.parse(text) as ExtractedPeca;
        return normalizeExtractedPeca(parsed);
    } catch (err) {
        throw new Error(`Falha ao parsear JSON da extração: ${(err as Error).message}`);
    }
}

const geminiExtractor: Extractor = {
    name: "google-gemini-2.5-flash",
    async fromText(text: string) {
        const messages: Message[] = [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: `Extraia a peça de voo a partir do texto abaixo:\n\n---\n${text}\n---`,
            },
        ];
        const result = await invokeLLM({
            messages,
            responseFormat: {
                type: "json_schema",
                json_schema: { name: "ExtractedPeca", schema: PECA_SCHEMA as any, strict: true },
            },
        });
        return parseStructuredOutput(result.choices?.[0]?.message?.content);
    },
    async fromImage(imageDataUrl: string) {
        const messages: Message[] = [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: [
                    { type: "text", text: "Extraia a peça de voo desta imagem (print de cotação):" },
                    { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
                ],
            },
        ];
        const result = await invokeLLM({
            messages,
            responseFormat: {
                type: "json_schema",
                json_schema: { name: "ExtractedPeca", schema: PECA_SCHEMA as any, strict: true },
            },
        });
        return parseStructuredOutput(result.choices?.[0]?.message?.content);
    },
};

// Cadeia de fallback: hoje apenas Google Gemini direto; ordem importa.
const extractors: Extractor[] = [geminiExtractor];

export interface ExtractionResult {
    peca: ExtractedPeca;
    providerUsado: string;
    tentativas: { provider: string; erro: string }[];
}

async function runWithFallback(
    op: (e: Extractor) => Promise<ExtractedPeca>
): Promise<ExtractionResult> {
    const tentativas: { provider: string; erro: string }[] = [];
    for (const ex of extractors) {
        try {
            const peca = await op(ex);
            return { peca, providerUsado: ex.name, tentativas };
        } catch (err) {
            tentativas.push({ provider: ex.name, erro: (err as Error).message });
        }
    }
    throw new Error(
        `Todos os provedores de IA falharam: ${tentativas.map((t) => `${t.provider}: ${t.erro}`).join(" | ")}`
    );
}

export async function extractPecaFromText(text: string): Promise<ExtractionResult> {
    if (!text || text.trim().length < 5) {
        throw new Error("Texto muito curto para extração");
    }
    return runWithFallback((e) => e.fromText(text));
}

export async function extractPecaFromImage(
    imageBase64: string,
    mimeType: string
): Promise<ExtractionResult> {
    if (!imageBase64) throw new Error("Imagem vazia");
    const dataUrl = imageBase64.startsWith("data:")
        ? imageBase64
        : `data:${mimeType};base64,${imageBase64}`;
    return runWithFallback((e) => e.fromImage(dataUrl));
}
