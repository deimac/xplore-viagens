import type { OfertaVoo, OfertaVooFlexSelection } from "@/types/ofertasVoo";

export function formatarPreco(valor: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valor);
}

const formatarDataFlex = (data: { mes: string; dia: string }) => {
    const mes = data.mes?.toLowerCase?.() ?? data.mes;
    return `${data.dia} ${mes}`;
};

const formatarDatasFlexiveis = (selecionadas?: OfertaVooFlexSelection) => {
    if (!selecionadas?.ida && !selecionadas?.volta) return "Datas flexíveis";
    const partes: string[] = [];
    if (selecionadas?.ida) partes.push(`Ida: ${formatarDataFlex(selecionadas.ida)}`);
    if (selecionadas?.volta) partes.push(`Volta: ${formatarDataFlex(selecionadas.volta)}`);
    return partes.join(" | ");
};

export function formatarInteresseFlexivel(selecionadas?: OfertaVooFlexSelection): string | null {
    if (!selecionadas?.ida && !selecionadas?.volta) return null;
    const partes: string[] = [];
    if (selecionadas?.ida) partes.push(`Ida ${formatarDataFlex(selecionadas.ida)}`);
    if (selecionadas?.volta) partes.push(`volta ${formatarDataFlex(selecionadas.volta)}`);
    return partes.join(" e ");
}

export function formatarInteresseFixo(linha: string[]): string {
    return linha.join(" | ");
}

export function gerarMensagemWhatsApp(
    oferta: OfertaVoo,
    selecionadas?: OfertaVooFlexSelection
): string {
    const destinosTexto =
        oferta.tipo === "DATA_FIXA"
            ? oferta.trechos.map((t) => `${t.origem} → ${t.destino}`).join(", ")
            : `${oferta.ida.rota} (ida) / ${oferta.volta.rota} (volta)`;

    const datasTexto =
        oferta.tipo === "DATA_FIXA"
            ? "Datas fixas conforme itinerário"
            : formatarDatasFlexiveis(selecionadas);

    return `Olá! Tenho interesse na oferta:\n\n` +
        `📍 ${oferta.titulo} (ID: ${oferta.id})\n` +
        `✈️ ${oferta.companhia}\n` +
        `🎫 ${oferta.classe}\n` +
        `🗺️ ${destinosTexto}\n` +
        `📅 ${datasTexto}\n` +
        `💰 ${formatarPreco(oferta.preco)} (${oferta.parcelas}x sem juros)\n\n` +
        `Gostaria de mais informações!`;
}

export function sanitizeWhatsAppNumber(raw?: string | null): string {
    if (!raw) return "";
    return raw.replace(/\D/g, "");
}

export function buildWhatsAppLink(
    oferta: OfertaVoo,
    rawNumber?: string | null,
    selecionadas?: OfertaVooFlexSelection
): string {
    const number = sanitizeWhatsAppNumber(rawNumber);
    const mensagem = gerarMensagemWhatsApp(oferta, selecionadas);
    return `https://wa.me/${number}?text=${encodeURIComponent(mensagem)}`;
}
