import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'xplore_viagens',
});

try {
  console.log('🔍 Verificando tabelas...\n');
  
  const [roomTypes] = await connection.execute('SELECT * FROM room_types');
  console.log('📋 Room Types:', roomTypes.length, 'registros');
  console.log(roomTypes);
  
  const [bedTypes] = await connection.execute('SELECT * FROM bed_types');
  console.log('\n📋 Bed Types:', bedTypes.length, 'registros');
  console.log(bedTypes);
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  await connection.end();
}
