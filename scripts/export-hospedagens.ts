// Exporta imóveis (hospedagens) e catálogos para hospedagens-export.json (importação no xplore360).
// Uso: pnpm tsx scripts/export-hospedagens.ts   (lê DATABASE_URL do .env; só SELECT)
// SITE_PUBLIC_URL (padrão https://xploreviagens.com.br) vira a base das imagens relativas.
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';

const base = (process.env.SITE_PUBLIC_URL || 'https://xploreviagens.com.br').replace(/\/+$/, '');

function absoluteUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente');
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  const rows = async (sql: string) => (await db.query(sql))[0] as any[];

  // Inclui imóveis inativos: a agência decide no xplore360.
  const props = await rows('SELECT * FROM properties ORDER BY id');
  const images = await rows('SELECT property_id, image_url, sort_order FROM property_images ORDER BY property_id, sort_order, id');
  const amenityRel = await rows('SELECT property_id, amenity_id FROM property_amenities_rel');
  const rooms = await rows('SELECT id, property_id, room_type_id, name, display_order, sleeping_photo FROM property_rooms ORDER BY property_id, display_order, id');
  const roomBeds = await rows('SELECT room_id, bed_type_id, quantity FROM room_beds');

  const group = <T>(list: T[], key: (x: T) => number) => {
    const m = new Map<number, T[]>();
    for (const x of list) { const k = key(x); (m.get(k) ?? m.set(k, []).get(k)!).push(x); }
    return m;
  };
  const imgBy = group(images, (i: any) => Number(i.property_id));
  const amBy = group(amenityRel, (a: any) => Number(a.property_id));
  const roomBy = group(rooms, (r: any) => Number(r.property_id));
  const bedBy = group(roomBeds, (b: any) => Number(b.room_id));

  const properties = props.map((p: any) => ({
    id: Number(p.id), name: p.name, slug: p.slug, description_short: p.description_short, description_full: p.description_full,
    property_type_id: p.property_type_id == null ? null : Number(p.property_type_id),
    address_street: p.address_street, address_number: p.address_number, address_complement: p.address_complement,
    neighborhood: p.neighborhood, city: p.city, state_region: p.state_region, country: p.country, postal_code: p.postal_code,
    latitude: p.latitude, longitude: p.longitude, max_guests: p.max_guests, bedrooms: p.bedrooms, beds: p.beds,
    bathrooms: p.bathrooms, xp: p.xp, area_m2: p.area_m2, active: p.active, is_featured: p.is_featured,
    mostrarNoSite: p.mostrarNoSite, mostrarNaTv: p.mostrarNaTv, created_at: p.created_at, updated_at: p.updated_at,
    images: (imgBy.get(Number(p.id)) ?? []).map((i: any) => ({ image_url: absoluteUrl(i.image_url), sort_order: i.sort_order ?? 0 })).filter((i) => i.image_url),
    amenity_ids: (amBy.get(Number(p.id)) ?? []).map((a: any) => Number(a.amenity_id)),
    rooms: (roomBy.get(Number(p.id)) ?? []).map((r: any) => ({
      room_type_id: Number(r.room_type_id), name: r.name, display_order: r.display_order ?? 0,
      sleeping_photo: absoluteUrl(r.sleeping_photo),
      beds: (bedBy.get(Number(r.id)) ?? []).map((b: any) => ({ bed_type_id: Number(b.bed_type_id), quantity: Number(b.quantity) || 1 })),
    })),
  }));

  const out = {
    properties,
    property_types: (await rows('SELECT id, name FROM property_types ORDER BY id')).map((r) => ({ id: Number(r.id), name: String(r.name) })),
    amenities: (await rows('SELECT id, name, icon FROM property_amenities ORDER BY id')).map((r) => ({ id: Number(r.id), name: String(r.name), icon: r.icon ?? null })),
    room_types: (await rows('SELECT id, name, icon FROM room_types ORDER BY id')).map((r) => ({ id: Number(r.id), name: String(r.name), icon: r.icon ?? null })),
    bed_types: (await rows('SELECT id, name, sleeps FROM bed_types ORDER BY id')).map((r) => ({ id: Number(r.id), name: String(r.name), sleeps: Number(r.sleeps) || 1 })),
  };

  await writeFile('hospedagens-export.json', JSON.stringify(out, null, 2));
  await db.end();
  console.log(`hospedagens-export.json: ${out.properties.length} imóveis, ${out.amenities.length} comodidades, ${out.room_types.length} tipos de espaço, ${out.bed_types.length} tipos de cama`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
