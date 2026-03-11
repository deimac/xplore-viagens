type MovimentacaoInput = {
    xp: number | string;
    tipo_nome?: string | null;
    tipo_slug?: string | null;
    tipo_descricao?: string | null;
    descricao?: string | null;
};

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

    if (slug === "codigo_promocional") {
        const codigo = parseCodigoFromDescricao(rawDescricao);
        valor = codigo ? `Codigo: ${codigo}` : null;
    } else if (slug !== "vencimento" && slug !== "expiracao") {
        // For regular movements, show custom operational detail when it differs from the default type description.
        const sameAsTipoDescricao =
            rawDescricao &&
            tipoDescricao &&
            rawDescricao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
            tipoDescricao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

        if (rawDescricao && !isInternalDescricao(rawDescricao) && !sameAsTipoDescricao) {
            valor = rawDescricao;
        }
    }

    return { titulo, descricao, valor };
}
