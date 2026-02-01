import type {
    OfertaVoo as OfertaVooDb,
    OfertaDataFixa as OfertaDataFixaDb,
    OfertaDataFlexivel as OfertaDataFlexivelDb,
} from "../drizzle/schema";

export type ClasseVoo = "PE" | "BS" | "FC";
export type ClasseVooCompleta = "Premium Economy" | "Business Class" | "First Class";

export type OfertaVooDataFixa = {
    id: number;
    tipo: "DATA_FIXA";
    titulo: string;
    companhia: string;
    classe: ClasseVooCompleta;
    preco: number;
    parcelas: number;
    imagemUrl: string;
    trechos: Array<{ origem: string; destino: string }>;
    linhasDatas: string[][];
};

export type OfertaVooDataFlexivel = {
    id: number;
    tipo: "DATA_FLEXIVEL";
    titulo: string;
    companhia: string;
    classe: ClasseVooCompleta;
    preco: number;
    parcelas: number;
    imagemUrl: string;
    ida: { rota: string; datasPorMes: Array<{ mes: string; dias: string[] }> };
    volta: { rota: string; datasPorMes: Array<{ mes: string; dias: string[] }> };
};

export type OfertaVooParsed = OfertaVooDataFixa | OfertaVooDataFlexivel;

const IMAGENS_PADRAO: Record<ClasseVooCompleta, string> = {
    "First Class": "/hero-santorini.jpg",
    "Business Class": "/newyork.jpg",
    "Premium Economy": "/paris.jpg",
};

export function mapearClasse(classe: string): ClasseVooCompleta {
    const normalizado = classe.trim().toUpperCase();
    if (normalizado === "PE" || normalizado === "PREMIUM ECONOMY") {
        return "Premium Economy";
    }
    if (normalizado === "BS" || normalizado === "BUSINESS" || normalizado === "BUSINESS CLASS") {
        return "Business Class";
    }
    if (normalizado === "FC" || normalizado === "FIRST" || normalizado === "FIRST CLASS") {
        return "First Class";
    }
    return "Business Class";
}

export function parsearOfertaVoo(
    dbRow: OfertaVooDb,
    datasFixas: OfertaDataFixaDb[],
    datasFlexiveis: OfertaDataFlexivelDb[]
): OfertaVooParsed {
    const tipoNormalizado = (dbRow.tipoOferta || "").toString().trim().toUpperCase();

    if (tipoNormalizado === "DATA_FIXA") {
        return parsearDataFixa(dbRow, datasFixas);
    }

    if (tipoNormalizado === "DATA_FLEXIVEL") {
        return parsearDataFlexivel(dbRow, datasFlexiveis);
    }

    if (dbRow.rotasFixas && datasFixas.length > 0) {
        return parsearDataFixa(dbRow, datasFixas);
    }

    if (dbRow.rotaIda && dbRow.rotaVolta && datasFlexiveis.length > 0) {
        return parsearDataFlexivel(dbRow, datasFlexiveis);
    }

    throw new Error("Oferta inválida: tipo desconhecido e campos ausentes");
}

function parsearDataFixa(dbRow: OfertaVooDb, datasFixas: OfertaDataFixaDb[]): OfertaVooDataFixa {
    if (!dbRow.rotasFixas) {
        throw new Error("Oferta DATA_FIXA inválida: rotas_fixas ausentes");
    }

    const rotas = parseCsv(dbRow.rotasFixas);
    const trechos = [] as Array<{ origem: string; destino: string }>;
    for (let i = 0; i < rotas.length - 1; i++) {
        trechos.push({ origem: rotas[i], destino: rotas[i + 1] });
    }

    const numTrechos = trechos.length;
    const linhasDatas: string[][] = [];
    for (const linha of datasFixas) {
        const datas = parseCsv(linha.datas);
        if (datas.length === numTrechos) {
            linhasDatas.push(datas);
        }
    }

    const classeCompleta = mapearClasse(String(dbRow.classe));

    return {
        id: dbRow.id,
        tipo: "DATA_FIXA",
        titulo: dbRow.titulo,
        companhia: dbRow.companhiaAerea,
        classe: classeCompleta,
        preco: parseFloat(dbRow.preco),
        parcelas: dbRow.parcelas,
        imagemUrl: dbRow.imagemUrl || IMAGENS_PADRAO[classeCompleta],
        trechos,
        linhasDatas,
    };
}

function parsearDataFlexivel(
    dbRow: OfertaVooDb,
    datasFlexiveis: OfertaDataFlexivelDb[]
): OfertaVooDataFlexivel {
    if (!dbRow.rotaIda || !dbRow.rotaVolta) {
        throw new Error("Oferta DATA_FLEXIVEL inválida: campos de rota ausentes");
    }

    const classeCompleta = mapearClasse(String(dbRow.classe));
    const rotaIda = normalizarRota(dbRow.rotaIda);
    const rotaVolta = normalizarRota(dbRow.rotaVolta);

    return {
        id: dbRow.id,
        tipo: "DATA_FLEXIVEL",
        titulo: dbRow.titulo,
        companhia: dbRow.companhiaAerea,
        classe: classeCompleta,
        preco: parseFloat(dbRow.preco),
        parcelas: dbRow.parcelas,
        imagemUrl: dbRow.imagemUrl || IMAGENS_PADRAO[classeCompleta],
        ida: {
            rota: rotaIda,
            datasPorMes: filtrarFlexiveisPorTipo(datasFlexiveis, "IDA"),
        },
        volta: {
            rota: rotaVolta,
            datasPorMes: filtrarFlexiveisPorTipo(datasFlexiveis, "VOLTA"),
        },
    };
}

function parseCsv(valor: string) {
    return valor
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
}

function normalizarRota(rota: string) {
    if (rota.includes("→")) {
        return rota;
    }
    if (rota.includes(",")) {
        const partes = rota
            .split(",")
            .map((parte) => parte.trim())
            .filter(Boolean);
        if (partes.length >= 2) {
            return `${partes[0]} → ${partes[1]}`;
        }
    }
    return rota;
}

function filtrarFlexiveisPorTipo(
    datasFlexiveis: OfertaDataFlexivelDb[],
    tipo: "IDA" | "VOLTA"
) {
    return datasFlexiveis
        .filter((item) => item.tipo === tipo)
        .map((item) => ({
            mes: item.mes.toUpperCase(),
            dias: parseCsv(item.dias),
        }));
}
