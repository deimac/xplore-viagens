type MovimentacaoInput = {
    xp: number | string;
    tipo_nome?: string | null;
    tipo_slug?: string | null;
    tipo_descricao?: string | null;
    descricao?: string | null;
    codigo_ref?: string | null;
    valor_referencia?: number | string | null;
    data_compra?: string | null;
};

function formatCurrencyBRL(value: number | string): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeIdentifier(value?: string | null): string {
    if (!value) return "";
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function parseCodigoFromDescricao(descricao?: string | null): string | null {
    if (!descricao) return null;
    const normalized = descricao
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const match = normalized.match(/codigo\s+promocional\s*:\s*(.+)$/i);
    return match?.[1]?.trim() || null;
}

function isInternalDescricao(descricao?: string | null): boolean {
    if (!descricao) return false;
    const d = descricao
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    return (
        d.startsWith("baixa automatica por vencimento") ||
        d.startsWith("expiracao automatica") ||
        d.startsWith("codigo promocional:")
    );
}

export function getMovimentacaoPresentation(mov: MovimentacaoInput) {
    const slug = normalizeIdentifier(mov.tipo_slug || mov.tipo_nome);
    const tipoDescricao = mov.tipo_descricao?.trim() || "";
    const rawDescricao = mov.descricao?.trim() || "";
    const titulo = mov.tipo_nome?.trim() || "Movimentacao";

    let descricao = tipoDescricao;
    if (!descricao) {
        descricao = Number(mov.xp) >= 0 ? "Credito de pontos" : "Debito de pontos";
    }

    let valor: string | null = null;

    const detalhesLancamento: string[] = [];
    if (mov.codigo_ref && mov.codigo_ref.trim()) {
        detalhesLancamento.push(`Codigo: ${mov.codigo_ref.trim()}`);
    }

    const sameAsTipoDescricao =
        rawDescricao &&
        tipoDescricao &&
        rawDescricao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
        tipoDescricao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (rawDescricao && !isInternalDescricao(rawDescricao) && !sameAsTipoDescricao) {
        detalhesLancamento.push(`Descricao: ${rawDescricao}`);
    }

    if (mov.valor_referencia !== null && mov.valor_referencia !== undefined && String(mov.valor_referencia).trim() !== "") {
        detalhesLancamento.push(`Valor Compra: ${formatCurrencyBRL(mov.valor_referencia)}`);
    }

    if (detalhesLancamento.length > 0) {
        valor = detalhesLancamento.join(" • ");
    }

    if (slug === "codigo_promocional") {
        const codigo = parseCodigoFromDescricao(rawDescricao);
        if (!valor) {
            valor = codigo ? `Codigo: ${codigo}` : null;
        }
    } else if (slug !== "vencimento" && slug !== "expiracao") {
        // Valor contextual já foi montado acima pelos campos estruturados do lançamento.
    }

    return { titulo, descricao, valor };
}
