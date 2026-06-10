/**
 * Extração assistida por IA para o Workspace de Cotações.
 *
 * Recebe texto colado ou imagem (print) e retorna uma proposta estruturada
 * de Peça (com segmentos) para revisão humana antes de salvar.
 *
 * O resultado nunca deve ser tratado como verdade incontestável: a UI
 * sempre apresenta os dados para edição/confirmação.
 *
 * Arquitetura: cadeia de extractors com política de custo controlada.
 * Para prints, tentamos OCR local primeiro e usamos Gemini apenas para
 * estruturar o texto; se falhar, caímos para visão Gemini direta.
 */

import { ENV } from "./_core/env";
import { invokeLLM, type Message, type ProviderName } from "./_core/llm";
import { extractTextFromImage } from "./_core/ocr";

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
    properties: {
        titulo: { type: "string", nullable: true },
        temVolta: { type: "boolean", nullable: true },
        origem: { type: "string", nullable: true, description: "Cidade ou aeroporto de origem da peça inteira" },
        destino: { type: "string", nullable: true, description: "Cidade ou aeroporto de destino final da peça" },
        dataSaida: { type: "string", nullable: true, description: "ISO 8601 sem timezone, ex 2026-06-15T22:35" },
        dataChegada: { type: "string", nullable: true },
        origemVolta: { type: "string", nullable: true },
        destinoVolta: { type: "string", nullable: true },
        dataSaidaVolta: { type: "string", nullable: true },
        dataChegadaVolta: { type: "string", nullable: true },
        duracaoMinutos: { type: "integer", nullable: true },
        duracaoMinutosVolta: { type: "integer", nullable: true },
        qtdConexoes: { type: "integer", minimum: 0 },
        qtdConexoesVolta: { type: "integer", nullable: true, minimum: 0 },
        companhias: { type: "string", nullable: true, description: "Lista resumida de cias, ex 'Gol, TAP'" },
        companhiasVolta: { type: "string", nullable: true },
        itemPessoal: {
            type: "integer",
            nullable: true,
            minimum: 0,
            description: "Quantidade de item pessoal (mochila/bolsa pequena). Use 1 se incluso e não especificado.",
        },
        bagagemMao: {
            type: "integer",
            nullable: true,
            minimum: 0,
            description: "Quantidade de bagagens de mão (carry-on)",
        },
        bagagemDespachada: {
            type: "integer",
            nullable: true,
            minimum: 0,
            description: "Quantidade de bagagens despachadas (porão)",
        },
        classe: { type: "string", nullable: true },
        classeVolta: { type: "string", nullable: true },
        observacoes: { type: "string", nullable: true },
        segmentos: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    direcao: { type: "string", nullable: true, enum: ["ida", "volta"] },
                    ordem: { type: "integer" },
                    aeroportoOrigem: { type: "string", nullable: true, description: "Código IATA 3 letras" },
                    aeroportoDestino: { type: "string", nullable: true },
                    cidadeOrigem: { type: "string", nullable: true },
                    cidadeDestino: { type: "string", nullable: true },
                    saida: { type: "string", nullable: true },
                    chegada: { type: "string", nullable: true },
                    companhia: { type: "string", nullable: true },
                    numeroVoo: { type: "string", nullable: true },
                    classe: { type: "string", nullable: true },
                    bagagem: { type: "string", nullable: true },
                    duracaoConexaoMinutos: { type: "integer", nullable: true },
                },
                required: ["ordem"],
            },
        },
        confianca: { type: "number", nullable: true, description: "0 a 1, autoavaliação da extração" },
    },
    required: ["segmentos"],
} as const;

const SYSTEM_PROMPT = `Você é um assistente de extração de dados de voos para um consultor de viagens brasileiro.

Sua tarefa é converter uma cotação de voo (em texto ou imagem) em JSON estruturado seguindo o schema.

Regras:
- Datas/horas devem ser ISO 8601 local (sem timezone), ex: "2026-06-15T22:35".
- Códigos de aeroporto devem ser IATA de 3 letras maiúsculas quando identificáveis.
- "ordem" dos segmentos começa em 0 e é sequencial por trecho.
- "qtdConexoes" = quantidade de segmentos de ida - 1; "qtdConexoesVolta" = segmentos de volta - 1.
- Campos não identificáveis devem ser null (não invente).
- Preencha "origem" e "destino" com o início e fim do trecho de ida.
- Preencha "dataSaida" e "dataChegada" com horários do trecho de ida.
- Se houver trecho de volta, preencha "origemVolta", "destinoVolta", "dataSaidaVolta", "dataChegadaVolta", "companhiasVolta", "classeVolta" e "qtdConexoesVolta". Marque "temVolta: true".
- Cada segmento deve ter "direcao": "ida" ou "volta" quando identificável.
- Bagagem: informe QUANTIDADES inteiras em itemPessoal, bagagemMao e bagagemDespachada.
  - itemPessoal: mochila/item pessoal (padrão 1 se incluso e não especificado).
  - bagagemMao: malas de mão / carry-on.
  - bagagemDespachada: malas despachadas / porão.
  - Ex.: "1 mala 23kg + 1 mão" → itemPessoal=1, bagagemMao=1, bagagemDespachada=1.
  - Se não houver bagagem inclusa, use 0 nos campos correspondentes.
- Companhia: nome completo se possível (ex: "Gol", "TAP Air Portugal", "Latam").
- "confianca" 0-1: avalie sua certeza da extração.

Responda SOMENTE com JSON válido, sem texto adicional, sem markdown, sem explicações.`;

export interface Extractor {
    name: string;
    fromText: (text: string, target?: "ida" | "volta") => Promise<ExtractedPeca>;
    fromImage: (imageDataUrl: string, target?: "ida" | "volta") => Promise<ExtractedPeca>;
}

const GEMINI_ONLY_PROVIDER_ORDER: ProviderName[] = ["google-gemini"];
const DEFAULT_EXTRACTION_ORDER = ["local-ocr-gemini", "gemini-vision"];
const OCR_MIN_TEXT_LENGTH = 20;

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
    let text =
        typeof content === "string"
            ? content
            : Array.isArray(content)
                ? content
                    .map((p: any) => (typeof p === "string" ? p : p?.text ?? ""))
                    .join("")
                : "";
    if (!text) throw new Error("LLM retornou conteúdo vazio");
    // Strip markdown code fences that some models add around JSON
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();
    // Find the outermost JSON object if there is surrounding text
    const objStart = text.indexOf("{");
    const objEnd = text.lastIndexOf("}");
    if (objStart !== -1 && objEnd > objStart) text = text.slice(objStart, objEnd + 1);
    try {
        const parsed = JSON.parse(text) as ExtractedPeca;
        return normalizeExtractedPeca(parsed);
    } catch (err) {
        throw new Error(`Falha ao parsear JSON da extração: ${(err as Error).message}`);
    }
}

function buildOcrObservation(engine: string, confidence: number | null, warnings: string[]): string {
    const parts = [`OCR local (${engine}${confidence == null ? "" : `, confiança ${(confidence * 100).toFixed(0)}%`})`];
    if (warnings.length) parts.push(`Avisos: ${warnings.join("; ")}`);
    return parts.join(". ");
}

function buildTargetInstruction(target?: "ida" | "volta"): string {
    if (target === "volta") {
        return "Extraia prioritariamente os dados da VOLTA. Se houver ida e volta no mesmo conteúdo, foque somente na volta e classifique segmentos como direcao='volta'.";
    }
    if (target === "ida") {
        return "Extraia prioritariamente os dados da IDA. Se houver ida e volta no mesmo conteúdo, foque somente na ida e classifique segmentos como direcao='ida'.";
    }
    return "";
}

function createLlmExtractor(name: string, providerOrder?: ProviderName[]): Extractor {
    return {
        name,
        async fromText(text: string, target?: "ida" | "volta") {
            const targetInstruction = buildTargetInstruction(target);
            const messages: Message[] = [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: targetInstruction
                        ? `${targetInstruction}\n\n${text}`
                        : text,
                },
            ];
            const result = await invokeLLM({
                providerOrder,
                messages,
                responseFormat: {
                    type: "json_schema",
                    json_schema: { name: "ExtractedPeca", schema: PECA_SCHEMA as any },
                },
            });
            return parseStructuredOutput(result.choices?.[0]?.message?.content);
        },
        async fromImage(imageDataUrl: string, target?: "ida" | "volta") {
            const targetInstruction = buildTargetInstruction(target);
            const userText = targetInstruction
                ? `Extraia a peça de voo desta imagem (print de cotação). ${targetInstruction}`
                : "Extraia a peça de voo desta imagem (print de cotação).";
            const messages: Message[] = [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        { type: "text", text: userText },
                        { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
                    ],
                },
            ];
            const result = await invokeLLM({
                providerOrder,
                messages,
                responseFormat: {
                    type: "json_schema",
                    json_schema: { name: "ExtractedPeca", schema: PECA_SCHEMA as any },
                },
            });
            return parseStructuredOutput(result.choices?.[0]?.message?.content);
        },
    };
}

const geminiExtractor = createLlmExtractor("gemini-vision", GEMINI_ONLY_PROVIDER_ORDER);

const localOcrGeminiExtractor: Extractor = {
    name: "local-ocr-gemini",
    async fromText(text: string, target?: "ida" | "volta") {
        return geminiExtractor.fromText(text, target);
    },
    async fromImage(imageDataUrl: string, target?: "ida" | "volta") {
        const ocr = await extractTextFromImage(imageDataUrl);
        if (ocr.text.trim().length < OCR_MIN_TEXT_LENGTH) {
            throw new Error("OCR local não encontrou texto suficiente para estruturar a cotação");
        }

        const peca = await geminiExtractor.fromText(
            `Texto extraído por OCR local de um print de cotação de voo. Extraia TODOS os dados de voo visíveis: origem, destino, datas, horários, companhias, número de voo, bagagem e segmentos. Não invente dados ausentes, mas preencha tudo que for identificável no texto.\n\n${ocr.text}`
            ,
            target
        );

        // Quality gate: if extraction returned no meaningful flight data, fall through
        // to next extractor (gemini-vision) which analyzes the image directly.
        const hasUsefulData =
            peca.origem != null ||
            peca.destino != null ||
            peca.dataSaida != null ||
            (Array.isArray(peca.segmentos) && peca.segmentos.length > 0 &&
                peca.segmentos.some((s: any) => s?.aeroportoOrigem || s?.aeroportoDestino || s?.saida));

        if (!hasUsefulData) {
            throw new Error("OCR extraiu texto mas Gemini não encontrou dados de voo estruturados — tentando visão direta");
        }

        const ocrObservation = buildOcrObservation(ocr.engine, ocr.confidence, ocr.warnings);
        return {
            ...peca,
            confianca: peca.confianca == null || ocr.confidence == null
                ? peca.confianca ?? ocr.confidence
                : Math.min(peca.confianca, ocr.confidence),
            observacoes: [peca.observacoes, ocrObservation].filter(Boolean).join("\n"),
        };
    },
};

const generalLlmExtractor = createLlmExtractor("configured-llm-vision");

function resolveImageExtractors(): Extractor[] {
    const registry = new Map<string, Extractor>([
        [localOcrGeminiExtractor.name, localOcrGeminiExtractor],
        [geminiExtractor.name, geminiExtractor],
    ]);

    if (ENV.aiExtractionAllowGeneralFallback) {
        registry.set(generalLlmExtractor.name, generalLlmExtractor);
    }

    const configured = ENV.aiExtractionOrder
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const order = configured.length ? configured : DEFAULT_EXTRACTION_ORDER;
    const extractors = order
        .map((name) => registry.get(name))
        .filter((extractor): extractor is Extractor => Boolean(extractor));

    if (extractors.length) return extractors;

    return DEFAULT_EXTRACTION_ORDER
        .map((name) => registry.get(name))
        .filter((extractor): extractor is Extractor => Boolean(extractor));
}

function resolveTextExtractors(): Extractor[] {
    return ENV.aiExtractionAllowGeneralFallback ? [geminiExtractor, generalLlmExtractor] : [geminiExtractor];
}

export interface ExtractionResult {
    peca: ExtractedPeca;
    providerUsado: string;
    tentativas: { provider: string; erro: string }[];
}

async function runWithFallback(
    extractors: Extractor[],
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

export async function extractPecaFromText(text: string, target?: "ida" | "volta"): Promise<ExtractionResult> {
    if (!text || text.trim().length < 5) {
        throw new Error("Texto muito curto para extração");
    }
    return runWithFallback(resolveTextExtractors(), (e) => e.fromText(text, target));
}

export async function extractPecaFromImage(
    imageBase64: string,
    mimeType: string,
    target?: "ida" | "volta"
): Promise<ExtractionResult> {
    if (!imageBase64) throw new Error("Imagem vazia");
    const dataUrl = imageBase64.startsWith("data:")
        ? imageBase64
        : `data:${mimeType};base64,${imageBase64}`;
    return runWithFallback(resolveImageExtractors(), (e) => e.fromImage(dataUrl, target));
}
