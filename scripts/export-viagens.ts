// Exporta viagens, categorias e destaques para viagens-export.json (importação no xplore360).
// Uso: pnpm tsx scripts/export-viagens.ts   (lê DATABASE_URL do .env; só leitura)
// SITE_PUBLIC_URL (padrão https://xploreviagens.com.br) vira a base das imagens relativas.
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { getAllCategorias, getAllDestaques, getAllViagensAdmin } from '../server/db';

const base = (process.env.SITE_PUBLIC_URL || 'https://xploreviagens.com.br').replace(/\/+$/, '');

function absoluteUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}

const toId = (r: any) => ({ id: Number(r.id), nome: String(r.nome) });

async function main() {
const viagens = (await getAllViagensAdmin()).map((v: any) => ({
  id: Number(v.id),
  titulo: v.titulo,
  slug: v.slug,
  descricao: v.descricao ?? '',
  tipoViagem: v.tipoViagem,
  origem: v.origem ?? null,
  dataIda: v.dataIda,
  dataVolta: v.dataVolta,
  quantidadePessoas: v.quantidadePessoas,
  valorTotal: v.valorTotal,
  quantidadeParcelas: v.quantidadeParcelas ?? null,
  valorParcela: v.valorParcela,
  temJuros: v.temJuros,
  xp: v.xp ?? 0,
  hospedagem: v.hospedagem ?? null,
  tipoQuarto: v.tipoQuarto,
  imagemUrl: absoluteUrl(v.imagemUrl),
  dataExpiracao: v.dataExpiracao,
  ativo: v.ativo,
  mostrarNoSite: v.mostrarNoSite,
  mostrarNaTv: v.mostrarNaTv,
  categorias: v.categorias,
  destaques: v.destaques,
}));

const out = {
  viagens,
  categorias: (await getAllCategorias()).map(toId),
  destaques: (await getAllDestaques()).map(toId),
};

await writeFile('viagens-export.json', JSON.stringify(out, null, 2));
console.log(`viagens-export.json: ${out.viagens.length} viagens, ${out.categorias.length} categorias, ${out.destaques.length} destaques`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
