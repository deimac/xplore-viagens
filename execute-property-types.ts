import { ENV } from './server/_core/env';
import mysql from 'mysql2/promise';

async function runMigrations() {
    const connection = await mysql.createConnection({
        host: ENV.DB_HOST,
        user: ENV.DB_USER,
        password: ENV.DB_PASSWORD,
        database: ENV.DB_NAME,
        port: Number(ENV.DB_PORT) || 3306,
        ssl: ENV.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false,
        multipleStatements: true, // Para executar múltiplas queries
    });

    try {
        console.log('🔄 Executando migration de tipos de propriedade...');

        // 1. Criar tabela property_types
        await connection.execute(`
      CREATE TABLE property_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        slug VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log('✅ Tabela property_types criada');

        // 2. Adicionar coluna property_type_id à tabela properties
        await connection.execute(`
      ALTER TABLE properties 
      ADD COLUMN property_type_id INT;
    `);
        console.log('✅ Coluna property_type_id adicionada');

        // 3. Criar índice para performance
        await connection.execute(`
      CREATE INDEX idx_properties_type ON properties(property_type_id);
    `);
        console.log('✅ Índice criado');

        // 4. Criar foreign key constraint
        await connection.execute(`
      ALTER TABLE properties 
      ADD CONSTRAINT fk_property_type 
      FOREIGN KEY (property_type_id) 
      REFERENCES property_types(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE;
    `);
        console.log('✅ Constraint de chave estrangeira criada');

        // 5. Inserir dados seed
        const seedData = [
            { name: 'Casa', slug: 'casa' },
            { name: 'Apartamento', slug: 'apartamento' },
            { name: 'Chalé', slug: 'chale' },
            { name: 'Pousada', slug: 'pousada' },
            { name: 'Hotel', slug: 'hotel' }
        ];

        for (const type of seedData) {
            await connection.execute(
                'INSERT INTO property_types (name, slug) VALUES (?, ?)',
                [type.name, type.slug]
            );
        }
        console.log('✅ Dados seed inseridos');

        console.log('🎉 Migration de tipos de propriedade concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a migration:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Executar se chamado diretamente
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations().catch(console.error);
}

export { runMigrations };