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
    origem?: string | null;
    destino?: string | null;
    dataSaida?: string | null;
    dataChegada?: string | null;
    duracaoMinutos?: number | null;
    qtdConexoes?: number;
    companhias?: string | null;
    bagagem?: string | null;
    classe?: string | null;
    observacoes?: string | null;
    segmentos: ExtractedSegmento[];
    confianca?: number | null;
}

const PECA_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        titulo: { type: ["string", "null"] },
        origem: { type: ["string", "null"], description: "Cidade ou aeroporto de origem da peça inteira" },
        destino: { type: ["string", "null"], description: "Cidade ou aeroporto de destino final da peça" },
        dataSaida: { type: ["string", "null"], description: "ISO 8601 sem timezone, ex 2026-06-15T22:35" },
        dataChegada: { type: ["string", "null"] },
        duracaoMinutos: { type: ["integer", "null"] },
        qtdConexoes: { type: "integer", minimum: 0 },
        companhias: { type: ["string", "null"], description: "Lista resumida de cias, ex 'Gol, TAP'" },
        bagagem: { type: ["string", "null"] },
        classe: { type: ["string", "null"] },
        observacoes: { type: ["string", "null"] },
        segmentos: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
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
- Bagagem: extraia exatamente como aparece (ex: "23kg + 10kg", "1 mala 23kg").
- Companhia: nome completo se possível (ex: "Gol", "TAP Air Portugal", "Latam").
- Se a imagem/texto tiver múltiplos itinerários distintos (ex: ida e volta separadas), extraia apenas o PRIMEIRO/PRINCIPAL como uma peça única; a peça deve ser unidade indivisível.
- "confianca" 0-1: avalie sua certeza da extração.

Responda SEMPRE seguindo estritamente o JSON Schema fornecido.`;

export interface Extractor {
    name: string;
    fromText: (text: string) => Promise<ExtractedPeca>;
    fromImage: (imageDataUrl: string) => Promise<ExtractedPeca>;
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
        if (!Array.isArray(parsed.segmentos)) parsed.segmentos = [];
        return parsed;
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
