import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const roomTypes = [
    { name: 'Quarto Individual', slug: 'individual' },
    { name: 'Quarto Duplo', slug: 'duplo' },
    { name: 'Quarto Triplo', slug: 'triplo' },
    { name: 'Quarto Família', slug: 'familia' },
    { name: 'Suíte', slug: 'suite' },
    { name: 'Suíte Master', slug: 'suite-master' },
    { name: 'Quarto com Varanda', slug: 'varanda' },
    { name: 'Quarto com Vista Mar', slug: 'vista-mar' },
    { name: 'Dormitório Compartilhado', slug: 'compartilhado' },
];

const bedTypes = [
    { name: 'Cama de Solteiro', slug: 'solteiro', sleeps_count: 1 },
    { name: 'Cama de Casal', slug: 'casal', sleeps_count: 2 },
    { name: 'Cama King', slug: 'king', sleeps_count: 2 },
    { name: 'Cama Queen', slug: 'queen', sleeps_count: 2 },
    { name: 'Beliche', slug: 'beliche', sleeps_count: 2 },
    { name: 'Sofá-cama', slug: 'sofa-cama', sleeps_count: 1 },
    { name: 'Colchão no Chão', slug: 'colchao-chao', sleeps_count: 1 },
];

async function seedRoomBedTypes() {
    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'xplore_viagens',
    });

    try {
        console.log('🌱 Populando tipos de quartos...');

        for (const roomType of roomTypes) {
            await connection.execute(
                'INSERT IGNORE INTO room_types (name, slug) VALUES (?, ?)',
                [roomType.name, roomType.slug]
            );
        }

        console.log('✅ Tipos de quartos populados!');
        console.log('🌱 Populando tipos de camas...');

        for (const bedType of bedTypes) {
            await connection.execute(
                'INSERT IGNORE INTO bed_types (name, slug, sleeps_count) VALUES (?, ?, ?)',
                [bedType.name, bedType.slug, bedType.sleeps_count]
            );
        }

        console.log('✅ Tipos de camas populados!');

        // Mostrar o que foi inserido
        const [roomTypesResult] = await connection.execute('SELECT * FROM room_types');
        const [bedTypesResult] = await connection.execute('SELECT * FROM bed_types');

        console.log('\n📋 Tipos de Quartos:', roomTypesResult.length);
        console.log(roomTypesResult);

        console.log('\n📋 Tipos de Camas:', bedTypesResult.length);
        console.log(bedTypesResult);

    } catch (error) {
        console.error('❌ Erro ao popular dados:', error);
    } finally {
        await connection.end();
    }
}

seedRoomBedTypes();
