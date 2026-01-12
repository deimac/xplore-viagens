import 'dotenv/config';
import mysql from 'mysql2/promise';

async function testConnection() {
  const url = "mysql://xplore:3PIbucxhrETl8pLJdovu3aajBKYEekhEEZWAThXHsghOonLXCbdTIGUo31vG9Y5x@31.97.249.115:3306/xplore_db"; // Substitua SUA_SENHA_AQUI
  
  console.log("🚀 Testando conexão com Hostinger...");
  
  try {
    const connection = await mysql.createConnection(url);
    console.log("✅ Conexão estabelecida com sucesso!");
    
    const [rows]: any = await connection.execute('SHOW TABLES');
    console.log("📋 Tabelas encontradas:", rows.map((r: any) => Object.values(r)[0]));
    
    const [travels]: any = await connection.execute('SELECT COUNT(*) as total FROM travels');
    console.log("✈️ Total de viagens no banco:", travels[0].total);
    
    await connection.end();
  } catch (err: any) {
    console.error("❌ ERRO AO CONECTAR:", err.message);
  }
}

testConnection();