import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/**
 * Configuração de conexão com o banco de dados PostgreSQL
 * 
 * Este módulo gerencia a conexão com o PostgreSQL usando o driver postgres.js
 * e o Drizzle ORM. As configurações são carregadas das variáveis de ambiente.
 * 
 * Requisitos atendidos:
 * - 2.1: Armazena dados em PostgreSQL
 * - 2.2: Estabelece conexão com o banco na inicialização
 * - 3.3: Conecta ao banco containerizado via Docker
 */

/**
 * Interface para configuração do banco de dados
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Obtém a configuração do banco de dados das variáveis de ambiente
 * 
 * @returns Objeto com as configurações do banco
 * @throws Error se alguma variável de ambiente obrigatória estiver faltando
 */
export function getDatabaseConfig(): DatabaseConfig {
  const requiredEnvVars = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_NAME',
    'DATABASE_USER',
    'DATABASE_PASSWORD'
  ];

  // Verifica se todas as variáveis obrigatórias estão definidas
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(', ')}`
    );
  }

  return {
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT!, 10),
    database: process.env.DATABASE_NAME!,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!
  };
}

/**
 * Cliente de conexão PostgreSQL
 * Inicializado como null e será criado na primeira chamada de getConnection()
 */
let queryClient: postgres.Sql | null = null;

/**
 * Instância do Drizzle ORM
 * Inicializada como null e será criada na primeira chamada de getConnection()
 */
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Cria e retorna a conexão com o banco de dados
 * 
 * Esta função implementa o padrão Singleton para garantir que apenas
 * uma conexão seja criada durante o ciclo de vida da aplicação.
 * 
 * @returns Instância do Drizzle ORM conectada ao PostgreSQL
 * @throws Error se houver falha ao conectar com o banco de dados
 * 
 * Requisitos atendidos:
 * - 2.2: Estabelece conexão com o banco na inicialização
 * - 2.4: Trata erros de conexão graciosamente
 */
export function getConnection() {
  // Se a conexão já existe, retorna a instância existente
  if (db) {
    return db;
  }

  try {
    // Obtém configurações do banco de dados
    const config = getDatabaseConfig();

    // Cria a string de conexão
    const connectionString = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;

    // Cria o cliente PostgreSQL
    queryClient = postgres(connectionString, {
      max: 10, // Máximo de conexões no pool
      idle_timeout: 20, // Timeout de conexões ociosas (segundos)
      connect_timeout: 10 // Timeout para estabelecer conexão (segundos)
    });

    // Cria a instância do Drizzle ORM
    db = drizzle(queryClient, { schema });

    console.log('✅ Conexão com o banco de dados estabelecida com sucesso');
    
    return db;
  } catch (error) {
    // Tratamento de erros de conexão
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao conectar com o banco de dados:', errorMessage);
    
    throw new Error(`Falha ao estabelecer conexão com o banco de dados: ${errorMessage}`);
  }
}

/**
 * Fecha a conexão com o banco de dados
 * 
 * Esta função deve ser chamada quando a aplicação está sendo encerrada
 * para garantir que todas as conexões sejam fechadas adequadamente.
 * 
 * @returns Promise que resolve quando a conexão é fechada
 */
export async function closeConnection(): Promise<void> {
  if (queryClient) {
    try {
      await queryClient.end();
      queryClient = null;
      db = null;
      console.log('✅ Conexão com o banco de dados fechada com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao fechar conexão com o banco de dados:', errorMessage);
      throw new Error(`Falha ao fechar conexão com o banco de dados: ${errorMessage}`);
    }
  }
}

/**
 * Testa a conexão com o banco de dados
 * 
 * Executa uma query simples para verificar se a conexão está funcionando.
 * Útil para health checks e validação durante a inicialização.
 * 
 * @returns Promise<boolean> true se a conexão está funcionando, false caso contrário
 */
export async function testConnection(): Promise<boolean> {
  try {
    if (!queryClient) {
      getConnection();
    }
    
    if (!queryClient) {
      throw new Error('Cliente de conexão não inicializado');
    }
    
    // Executa uma query simples para testar a conexão
    await queryClient`SELECT 1`;
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Teste de conexão falhou:', errorMessage);
    return false;
  }
}
