import { getDb } from "./db";
import { ofertasVoo, ofertasDatasFixas, ofertasDatasFlexiveis } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import type { ClasseVoo } from "./ofertasVoo";

export interface OfertaVooPremiumInput {
    tipo_oferta: 'DATA_FIXA' | 'DATA_FLEXIVEL';
    titulo: string;
    descricao?: string;
    origem_principal: string;
    destinos_resumo?: string;
    companhia_aerea: string;
    classe_voo: ClasseVoo;
    preco: number;
    parcelas?: string;
    rotas_fixas?: string;
    rota_ida?: string;
    rota_volta?: string;
    imagem_url?: string;
    ativo: boolean;
}

export interface DataFixaInput {
    datas_opcao: string;
}

export interface DataFlexivelInput {
    tipo: 'IDA' | 'VOLTA';
    mes_referencia: string;
    dias_disponiveis: string;
}

export interface OfertaComDatas extends OfertaVooPremiumInput {
    id: number;
    datas_fixas?: DataFixaInput[];
    datas_flexiveis?: DataFlexivelInput[];
}

/**
 * Lista todas as ofertas de voo premium
 */
export async function listarOfertasPremium(): Promise<OfertaComDatas[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const ofertas = await db
        .select()
        .from(ofertasVoo)
        .orderBy(desc(ofertasVoo.id));

    const ofertasComDatas: OfertaComDatas[] = [];

    for (const oferta of ofertas) {
        const ofertaData: OfertaComDatas = {
            id: oferta.id,
            tipo_oferta: oferta.tipoOferta as 'DATA_FIXA' | 'DATA_FLEXIVEL',
            titulo: oferta.titulo,
            descricao: oferta.descricao || undefined,
            origem_principal: oferta.origemPrincipal || '',
            destinos_resumo: oferta.destinosResumo || undefined,
            companhia_aerea: oferta.companhiaAerea,
            classe_voo: oferta.classe as ClasseVoo,
            preco: parseFloat(oferta.preco),
            parcelas: oferta.parcelas?.toString() || undefined,
            rotas_fixas: oferta.rotasFixas || undefined,
            rota_ida: oferta.rotaIda || undefined,
            rota_volta: oferta.rotaVolta || undefined,
            imagem_url: oferta.imagemUrl || undefined,
            ativo: oferta.ativo === 1,
        };

        // Buscar datas associadas
        if (oferta.tipoOferta === 'DATA_FIXA') {
            const datas = await db
                .select()
                .from(ofertasDatasFixas)
                .where(eq(ofertasDatasFixas.ofertaId, oferta.id));

            ofertaData.datas_fixas = datas.map(d => ({
                datas_opcao: d.datas
            }));
        } else {
            const datas = await db
                .select()
                .from(ofertasDatasFlexiveis)
                .where(eq(ofertasDatasFlexiveis.ofertaId, oferta.id));

            ofertaData.datas_flexiveis = datas.map(d => ({
                tipo: d.tipo as 'IDA' | 'VOLTA',
                mes_referencia: d.mes,
                dias_disponiveis: d.dias
            }));
        }

        ofertasComDatas.push(ofertaData);
    }

    return ofertasComDatas;
}

/**
 * Busca uma oferta específica por ID
 */
export async function buscarOfertaPorId(id: number): Promise<OfertaComDatas | null> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [oferta] = await db
        .select()
        .from(ofertasVoo)
        .where(eq(ofertasVoo.id, id))
        .limit(1);

    if (!oferta) return null;

    const ofertaData: OfertaComDatas = {
        id: oferta.id,
        tipo_oferta: oferta.tipoOferta as 'DATA_FIXA' | 'DATA_FLEXIVEL',
        titulo: oferta.titulo,
        descricao: oferta.descricao || undefined,
        origem_principal: oferta.origemPrincipal || '',
        destinos_resumo: oferta.destinosResumo || undefined,
        companhia_aerea: oferta.companhiaAerea,
        classe_voo: oferta.classe as ClasseVoo,
        preco: parseFloat(oferta.preco),
        parcelas: oferta.parcelas?.toString() || undefined,
        rotas_fixas: oferta.rotasFixas || undefined,
        rota_ida: oferta.rotaIda || undefined,
        rota_volta: oferta.rotaVolta || undefined,
        imagem_url: oferta.imagemUrl || undefined,
        ativo: oferta.ativo === 1,
    };

    // Buscar datas associadas
    if (oferta.tipoOferta === 'DATA_FIXA') {
        const datas = await db
            .select()
            .from(ofertasDatasFixas)
            .where(eq(ofertasDatasFixas.ofertaId, oferta.id));

        ofertaData.datas_fixas = datas.map(d => ({
            datas_opcao: d.datas
        }));
    } else {
        const datas = await db
            .select()
            .from(ofertasDatasFlexiveis)
            .where(eq(ofertasDatasFlexiveis.ofertaId, oferta.id));

        ofertaData.datas_flexiveis = datas.map(d => ({
            tipo: d.tipo as 'IDA' | 'VOLTA',
            mes_referencia: d.mes,
            dias_disponiveis: d.dias
        }));
    }

    return ofertaData;
}

/**
 * Cria uma nova oferta de voo premium
 */
export async function criarOfertaPremium(
    input: OfertaVooPremiumInput,
    datas_fixas?: DataFixaInput[],
    datas_flexiveis?: DataFlexivelInput[]
): Promise<number> {
    // Validações
    if (input.tipo_oferta === 'DATA_FIXA') {
        if (!input.rotas_fixas || input.rotas_fixas.trim() === '') {
            throw new Error('Rotas fixas são obrigatórias para ofertas de data fixa');
        }
        if (!datas_fixas || datas_fixas.length === 0) {
            throw new Error('É necessário adicionar pelo menos uma opção de datas');
        }
    } else {
        if (!input.rota_ida || input.rota_ida.trim() === '') {
            throw new Error('Rota de ida é obrigatória');
        }
        if (!input.rota_volta || input.rota_volta.trim() === '') {
            throw new Error('Rota de volta é obrigatória');
        }
        if (!datas_flexiveis || datas_flexiveis.length === 0) {
            throw new Error('É necessário adicionar datas de ida e volta');
        }
        const temIda = datas_flexiveis.some(d => d.tipo === 'IDA');
        const temVolta = datas_flexiveis.some(d => d.tipo === 'VOLTA');
        if (!temIda || !temVolta) {
            throw new Error('É necessário adicionar pelo menos uma data de IDA e uma de VOLTA');
        }
    }

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Inserir oferta principal
    const [result] = await db.insert(ofertasVoo).values({
        tipoOferta: input.tipo_oferta,
        titulo: input.titulo,
        descricao: input.descricao || null,
        origemPrincipal: input.origem_principal,
        destinosResumo: input.destinos_resumo || null,
        companhiaAerea: input.companhia_aerea,
        classe: input.classe_voo,
        preco: input.preco.toString(),
        parcelas: input.parcelas ? parseInt(input.parcelas) : 1,
        rotasFixas: input.rotas_fixas || null,
        rotaIda: input.rota_ida || null,
        rotaVolta: input.rota_volta || null,
        imagemUrl: input.imagem_url || null,
        ativo: input.ativo ? 1 : 0,
    });

    const ofertaId = result.insertId;

    // Inserir datas
    if (input.tipo_oferta === 'DATA_FIXA' && datas_fixas) {
        for (const data of datas_fixas) {
            await db.insert(ofertasDatasFixas).values({
                ofertaId: ofertaId,
                datas: data.datas_opcao,
            });
        }
    } else if (input.tipo_oferta === 'DATA_FLEXIVEL' && datas_flexiveis) {
        for (const data of datas_flexiveis) {
            await db.insert(ofertasDatasFlexiveis).values({
                ofertaId: ofertaId,
                tipo: data.tipo,
                mes: data.mes_referencia,
                dias: data.dias_disponiveis,
            });
        }
    }

    return ofertaId;
}

/**
 * Atualiza uma oferta existente
 */
export async function atualizarOfertaPremium(
    id: number,
    input: OfertaVooPremiumInput,
    datas_fixas?: DataFixaInput[],
    datas_flexiveis?: DataFlexivelInput[]
): Promise<void> {
    // Validações
    if (input.tipo_oferta === 'DATA_FIXA') {
        if (!input.rotas_fixas || input.rotas_fixas.trim() === '') {
            throw new Error('Rotas fixas são obrigatórias para ofertas de data fixa');
        }
        if (!datas_fixas || datas_fixas.length === 0) {
            throw new Error('É necessário adicionar pelo menos uma opção de datas');
        }
    } else {
        if (!input.rota_ida || input.rota_ida.trim() === '') {
            throw new Error('Rota de ida é obrigatória');
        }
        if (!input.rota_volta || input.rota_volta.trim() === '') {
            throw new Error('Rota de volta é obrigatória');
        }
        if (!datas_flexiveis || datas_flexiveis.length === 0) {
            throw new Error('É necessário adicionar datas de ida e volta');
        }
        const temIda = datas_flexiveis.some(d => d.tipo === 'IDA');
        const temVolta = datas_flexiveis.some(d => d.tipo === 'VOLTA');
        if (!temIda || !temVolta) {
            throw new Error('É necessário adicionar pelo menos uma data de IDA e uma de VOLTA');
        }
    }

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Atualizar oferta principal
    await db.update(ofertasVoo)
        .set({
            tipoOferta: input.tipo_oferta,
            titulo: input.titulo,
            descricao: input.descricao || null,
            origemPrincipal: input.origem_principal,
            destinosResumo: input.destinos_resumo || null,
            companhiaAerea: input.companhia_aerea,
            classe: input.classe_voo,
            preco: input.preco.toString(),
            parcelas: input.parcelas ? parseInt(input.parcelas) : 1,
            rotasFixas: input.rotas_fixas || null,
            rotaIda: input.rota_ida || null,
            rotaVolta: input.rota_volta || null,
            imagemUrl: input.imagem_url || null,
            ativo: input.ativo ? 1 : 0,
        })
        .where(eq(ofertasVoo.id, id));

    // Deletar datas antigas
    await db.delete(ofertasDatasFixas).where(eq(ofertasDatasFixas.ofertaId, id));
    await db.delete(ofertasDatasFlexiveis).where(eq(ofertasDatasFlexiveis.ofertaId, id));

    // Inserir novas datas
    if (input.tipo_oferta === 'DATA_FIXA' && datas_fixas) {
        for (const data of datas_fixas) {
            await db.insert(ofertasDatasFixas).values({
                ofertaId: id,
                datas: data.datas_opcao,
            });
        }
    } else if (input.tipo_oferta === 'DATA_FLEXIVEL' && datas_flexiveis) {
        for (const data of datas_flexiveis) {
            await db.insert(ofertasDatasFlexiveis).values({
                ofertaId: id,
                tipo: data.tipo,
                mes: data.mes_referencia,
                dias: data.dias_disponiveis,
            });
        }
    }
}

/**
 * Exclui uma oferta
 */
export async function excluirOfertaPremium(id: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Deletar datas (cascade manual)
    await db.delete(ofertasDatasFixas).where(eq(ofertasDatasFixas.ofertaId, id));
    await db.delete(ofertasDatasFlexiveis).where(eq(ofertasDatasFlexiveis.ofertaId, id));

    // Deletar oferta
    await db.delete(ofertasVoo).where(eq(ofertasVoo.id, id));
}

/**
 * Alterna o status ativo/inativo
 */
export async function alterarStatusOferta(id: number, ativo: boolean): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.update(ofertasVoo)
        .set({ ativo: ativo ? 1 : 0 })
        .where(eq(ofertasVoo.id, id));
}
