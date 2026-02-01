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

export type OfertaVoo = OfertaVooDataFixa | OfertaVooDataFlexivel;

export type OfertaVooFlexDate = {
    mes: string;
    dia: string;
};

export type OfertaVooFlexSelection = {
    ida?: OfertaVooFlexDate | null;
    volta?: OfertaVooFlexDate | null;
};
