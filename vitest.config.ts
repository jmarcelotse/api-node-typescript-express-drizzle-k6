import { defineConfig } from 'vitest/config';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env antes dos testes
dotenv.config();

export default defineConfig({
  test: {
    // Timeout global para testes (útil para testes de integração com banco)
    testTimeout: 10000,
    
    // Executa testes em sequência (importante para testes de banco de dados)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    
    // Configuração de ambiente
    env: {
      DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
      DATABASE_PORT: process.env.DATABASE_PORT || '5432',
      DATABASE_NAME: process.env.DATABASE_NAME || 'todo_db',
      DATABASE_USER: process.env.DATABASE_USER || 'postgres',
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'postgres',
      NODE_ENV: 'test'
    }
  }
});
