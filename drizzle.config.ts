import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

/**
 * Configuração do Drizzle Kit para gerenciamento de migrações
 * 
 * Este arquivo configura o Drizzle Kit para gerar e aplicar migrações
 * no banco de dados PostgreSQL. As configurações incluem:
 * - Localização dos arquivos de schema
 * - Diretório de saída das migrações
 * - Credenciais de conexão com o banco de dados
 * 
 * Requisitos atendidos:
 * - 2.1: Configuração para persistência de dados no PostgreSQL
 */
export default defineConfig({
  // Dialeto do banco de dados
  dialect: 'postgresql',
  
  // Localização dos arquivos de schema do Drizzle
  schema: './src/db/schema.ts',
  
  // Diretório onde as migrações serão armazenadas
  out: './drizzle',
  
  // Configurações de conexão com o banco de dados
  dbCredentials: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'todo_db',
    ssl: false // Desabilitado para desenvolvimento local
  },
  
  // Habilita logs detalhados durante a execução
  verbose: true,
  
  // Modo strict para validações mais rigorosas
  strict: true
});
