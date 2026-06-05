import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type ProviderName = "openrouter" | "groq" | "google-gemini" | "xai-grok" | "openai";

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  providerOrder?: ProviderName[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

type ProviderCandidate = {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  extraHeaders?: Record<string, string>;
};

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const XAI_BASE_URL = "https://api.x.ai/v1";
const OPENAI_BASE_URL = "https://api.openai.com/v1";

const DEFAULT_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
const DEFAULT_OPENROUTER_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-r1-0528:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];
const DEFAULT_GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];
const DEFAULT_XAI_MODELS = ["grok-3-mini-fast", "grok-3-mini"];
const DEFAULT_OPENAI_MODELS = ["gpt-4o-mini"];
const DEFAULT_PROVIDER_ORDER: ProviderName[] = [
  "openrouter",
  "groq",
  "google-gemini",
  "xai-grok",
  "openai",
];

const parseModelList = (raw: string, defaults: string[]): string[] => {
  const configured = raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const source = configured.length ? configured : defaults;
  return [...new Set(source)];
};

const resolveApiUrl = (provider: ProviderCandidate) => `${provider.baseUrl}/chat/completions`;

const resolveProviderOrder = (forcedOrder?: ProviderName[]): ProviderName[] => {
  if (forcedOrder?.length) return [...new Set(forcedOrder)];

  const configured = (process.env.LLM_PROVIDER_ORDER || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  if (!configured.length) return DEFAULT_PROVIDER_ORDER;

  const normalized: ProviderName[] = [];
  for (const item of configured) {
    if (item === "openrouter") normalized.push("openrouter");
    else if (item === "groq") normalized.push("groq");
    else if (item === "google-gemini" || item === "gemini") normalized.push("google-gemini");
    else if (item === "xai-grok" || item === "xai" || item === "grok") normalized.push("xai-grok");
    else if (item === "openai") normalized.push("openai");
  }

  return normalized.length ? [...new Set(normalized)] : DEFAULT_PROVIDER_ORDER;
};

const resolveProviderCandidates = (forcedOrder?: ProviderName[]): ProviderCandidate[] => {
  const providerMap = new Map<ProviderName, ProviderCandidate>();

  if (ENV.geminiApiKey) {
    providerMap.set("google-gemini", {
      name: "google-gemini",
      baseUrl: GEMINI_BASE_URL,
      apiKey: ENV.geminiApiKey,
      models: parseModelList(process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "", DEFAULT_GEMINI_MODELS),
    });
  }

  if (ENV.openRouterApiKey) {
    providerMap.set("openrouter", {
      name: "openrouter",
      baseUrl: OPENROUTER_BASE_URL,
      apiKey: ENV.openRouterApiKey,
      models: parseModelList(process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || "", DEFAULT_OPENROUTER_MODELS),
      extraHeaders: {
        "HTTP-Referer": ENV.publicUrl || ENV.frontendUrl || "https://xplore-viagens.local",
        "X-Title": ENV.appName || "Xplore Viagens",
      },
    });
  }

  if (ENV.groqApiKey) {
    providerMap.set("groq", {
      name: "groq",
      baseUrl: GROQ_BASE_URL,
      apiKey: ENV.groqApiKey,
      models: parseModelList(process.env.GROQ_MODELS || process.env.GROQ_MODEL || "", DEFAULT_GROQ_MODELS),
    });
  }

  if (ENV.xaiApiKey) {
    providerMap.set("xai-grok", {
      name: "xai-grok",
      baseUrl: XAI_BASE_URL,
      apiKey: ENV.xaiApiKey,
      models: parseModelList(process.env.XAI_MODELS || process.env.XAI_MODEL || "", DEFAULT_XAI_MODELS),
    });
  }

  if (ENV.openAiApiKey) {
    providerMap.set("openai", {
      name: "openai",
      baseUrl: OPENAI_BASE_URL,
      apiKey: ENV.openAiApiKey,
      models: parseModelList(process.env.OPENAI_MODELS || process.env.OPENAI_MODEL || "", DEFAULT_OPENAI_MODELS),
    });
  }

  const order = resolveProviderOrder(forcedOrder);
  return order
    .map((name) => providerMap.get(name))
    .filter((provider): provider is ProviderCandidate => Boolean(provider));
};

const isModelUnavailableError = (status: number, errorText: string): boolean => {
  if (status !== 400 && status !== 404) return false;
  const text = errorText.toLowerCase();
  return (
    text.includes("model") &&
    (text.includes("not found") ||
      text.includes("not available") ||
      text.includes("unsupported") ||
      text.includes("não está disponível") ||
      text.includes("indispon"))
  );
};

const assertApiKey = (forcedOrder?: ProviderName[]) => {
  const providers = resolveProviderCandidates(forcedOrder);
  if (!providers.length) {
    throw new Error(
      "Nenhum provedor de IA está configurado. Defina pelo menos uma chave: GEMINI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, XAI_API_KEY ou OPENAI_API_KEY."
    );
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey(params.providerOrder);

  const {
    messages,
    providerOrder,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payloadBase: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payloadBase.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payloadBase.tool_choice = normalizedToolChoice;
  }

  payloadBase.max_tokens = 8192;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payloadBase.response_format = normalizedResponseFormat;
  }

  const providers = resolveProviderCandidates(providerOrder);
  const errors: string[] = [];

  for (const provider of providers) {
    for (let i = 0; i < provider.models.length; i++) {
      const model = provider.models[i];
      const payload = { ...payloadBase, model };

      try {
        const response = await fetch(resolveApiUrl(provider), {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${provider.apiKey}`,
            ...(provider.extraHeaders || {}),
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          return (await response.json()) as InvokeResult;
        }

        const errorText = await response.text();
        const errorMsg = `${provider.name}/${model}: ${response.status} ${response.statusText} – ${errorText}`;
        errors.push(errorMsg);

        const shouldTryNextModel =
          i < provider.models.length - 1 &&
          isModelUnavailableError(response.status, errorText);

        if (shouldTryNextModel) {
          continue;
        }

        // Sai do provedor atual e tenta o próximo provedor configurado.
        break;
      } catch (err) {
        const errorMsg = `${provider.name}/${model}: network error – ${(err as Error).message}`;
        errors.push(errorMsg);
        break;
      }
    }
  }

  throw new Error(`LLM invoke failed em todos os provedores/modelos: ${errors.join(" | ")}`);
}
