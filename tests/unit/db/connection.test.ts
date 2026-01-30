import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getConnection, closeConnection, testConnection, getDatabaseConfig } from '../../../src/db/connection';

/**
 * Testes unitários para o módulo de conexão com o banco de dados
 * 
 * Valida:
 * - Configuração do banco de dados a partir de variáveis de ambiente
 * - Estabelecimento de conexão com PostgreSQL
 * - Tratamento de erros de conexão
 * - Fechamento adequado de conexões
 */

describe('Database Connection', () => {
  beforeAll(() => {
    // Garante que as variáveis de ambiente estão definidas
    process.env.DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
    process.env.DATABASE_PORT = process.env.DATABASE_PORT || '5432';
    process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'todo_db';
    process.env.DATABASE_USER = process.env.DATABASE_USER || 'postgres';
    process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || 'postgres';
  });

  afterAll(async () => {
    // Fecha a conexão após todos os testes
    await closeConnection();
  });

  describe('getDatabaseConfig', () => {
    it('deve retornar configuração válida quando todas as variáveis de ambiente estão definidas', () => {
      const config = getDatabaseConfig();

      expect(config).toBeDefined();
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('todo_db');
      expect(config.user).toBe('postgres');
      expect(config.password).toBe('postgres');
    });

    it('deve lançar erro quando variáveis de ambiente obrigatórias estão faltando', () => {
      // Salva valores originais
      const originalHost = process.env.DATABASE_HOST;
      
      // Remove variável temporariamente
      delete process.env.DATABASE_HOST;

      expect(() => getDatabaseConfig()).toThrow(
        'Variáveis de ambiente obrigatórias não definidas: DATABASE_HOST'
      );

      // Restaura valor original
      process.env.DATABASE_HOST = originalHost;
    });
  });

  describe('getConnection', () => {
    it('deve estabelecer conexão com o banco de dados', () => {
      const db = getConnection();
      
      expect(db).toBeDefined();
      expect(db).toHaveProperty('query');
    });

    it('deve retornar a mesma instância em chamadas subsequentes (Singleton)', () => {
      const db1 = getConnection();
      const db2 = getConnection();
      
      expect(db1).toBe(db2);
    });
  });

  describe('testConnection', () => {
    it('deve retornar true quando a conexão está funcionando', async () => {
      const result = await testConnection();
      
      expect(result).toBe(true);
    });
  });

  describe('closeConnection', () => {
    it('deve fechar a conexão sem erros', async () => {
      // Primeiro estabelece uma conexão
      getConnection();
      
      // Depois fecha
      await expect(closeConnection()).resolves.not.toThrow();
    });
  });
});
