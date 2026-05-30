import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type CotacaoFull = NonNullable<RouterOutput["cotacoesWorkspace"]["getFull"]>;
export type PecaCompleta = CotacaoFull["pecas"][number];
export type SegmentoCompleto = PecaCompleta["segmentos"][number];
export type CenarioCompleto = CotacaoFull["cenarios"][number];
export type CenarioPecaLink = CenarioCompleto["pecas"][number];
export type CotacaoStatus = CotacaoFull["cotacao"]["status"];

export type DragKind = "peca-library" | "cenario-link";

export interface DragData {
    kind: DragKind;
    pecaId: number;
    cenarioId?: number;
    linkId?: number;
}

export const STATUS_COTACAO_LABEL: Record<CotacaoStatus, string> = {
    rascunho: "Rascunho",
    em_pesquisa: "Em pesquisa",
    em_montagem: "Em montagem",
    proposta_enviada: "Proposta enviada",
    fechada: "Fechada",
    cancelada: "Cancelada",
};

export const TIPO_FINANCEIRO_LABEL: Record<PecaCompleta["tipoFinanceiro"], string> = {
    pagante: "Pagante",
    milhas: "Milhas",
    misto: "Misto",
};
