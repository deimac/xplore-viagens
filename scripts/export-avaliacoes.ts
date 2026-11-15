// Exporta avaliações (com autor) para avaliacoes-export.json (importação no xplore360).
// Uso: pnpm tsx scripts/export-avaliacoes.ts   (lê DATABASE_URL do .env; só SELECT)
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente');
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  const [list] = await db.query(
    `SELECT r.id, r.rating, r.comment, r.status, r.createdAt,
            a.name, a.email, a.avatarUrl, a.providerId, a.loginMethod
       FROM reviews r JOIN reviewAuthors a ON a.id = r.authorId
      ORDER BY r.id`,
  );
  const reviews = (list as any[]).map((r) => ({
    id: Number(r.id),
    rating: Number(r.rating),
    comment: r.comment,
    status: r.status,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    author: {
      name: r.name,
      email: r.email ?? null,
      avatarUrl: r.avatarUrl ?? null,
      providerId: r.providerId ?? null,
      loginMethod: r.loginMethod ?? null,
    },
  }));
  await writeFile('avaliacoes-export.json', JSON.stringify({ reviews }, null, 2));
  await db.end();
  console.log(`avaliacoes-export.json: ${reviews.length} avaliações`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
