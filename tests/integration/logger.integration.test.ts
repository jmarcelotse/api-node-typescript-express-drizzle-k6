import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { logger } from '../../src/config/logger';

/**
 * Testes de integração para o logger
 * 
 * Valida que o logger funciona corretamente em cenários reais
 * de uso na aplicação, incluindo logging de requisições,
 * erros e operações de banco de dados.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

describe('Logger Integration Tests', () => {
  beforeAll(() => {
    // Setup inicial se necessário
  });

  afterAll(() => {
    // Cleanup se necessário
  });

  it('deve logar informações de inicialização da aplicação', () => {
    expect(() => {
      logger.info('Aplicação iniciando...');
      logger.info({ version: '1.0.0', env: 'test' }, 'Configuração carregada');
      logger.info({ port: 3000 }, 'Servidor pronto');
    }).not.toThrow();
  });

  it('deve logar requisições HTTP com metadata estruturada', () => {
    const requestData = {
      method: 'POST',
      path: '/api/tasks',
      statusCode: 201,
      responseTime: 45,
      userAgent: 'test-agent',
      ip: '127.0.0.1'
    };

    expect(() => {
      logger.info(requestData, 'Requisição HTTP processada');
    }).not.toThrow();
  });

  it('deve logar operações de banco de dados', () => {
    const dbOperation = {
      operation: 'INSERT',
      table: 'tasks',
      duration: 23,
      rowsAffected: 1
    };

    expect(() => {
      logger.info(dbOperation, 'Operação de banco executada');
    }).not.toThrow();
  });

  it('deve logar erros com stack trace e contexto', () => {
    const error = new Error('Erro de teste de integração');
    const context = {
      userId: 123,
      operation: 'createTask',
      timestamp: new Date().toISOString()
    };

    expect(() => {
      logger.error({ err: error, ...context }, 'Erro ao processar operação');
    }).not.toThrow();
  });

  it('deve logar warnings sobre performance', () => {
    const performanceData = {
      responseTime: 5000,
      endpoint: '/api/tasks',
      threshold: 1000
    };

    expect(() => {
      logger.warn(performanceData, 'Resposta lenta detectada');
    }).not.toThrow();
  });

  it('deve criar child logger com contexto específico', () => {
    const requestLogger = logger.child({ 
      requestId: 'req-test-123',
      userId: 456 
    });

    expect(() => {
      requestLogger.info('Iniciando processamento');
      requestLogger.info('Validação concluída');
      requestLogger.info('Operação finalizada');
    }).not.toThrow();
  });

  it('deve logar em diferentes níveis de severidade', () => {
    expect(() => {
      logger.debug({ data: 'debug info' }, 'Mensagem de debug');
      logger.info({ data: 'info data' }, 'Mensagem de info');
      logger.warn({ data: 'warning data' }, 'Mensagem de warning');
      logger.error({ data: 'error data' }, 'Mensagem de erro');
    }).not.toThrow();
  });

  it('deve logar eventos do ciclo de vida da aplicação', () => {
    expect(() => {
      logger.info('Conectando ao banco de dados...');
      logger.info({ host: 'localhost', port: 5432 }, 'Conexão estabelecida');
      logger.info('Aplicação pronta para receber requisições');
    }).not.toThrow();
  });

  it('deve logar métricas da aplicação', () => {
    const metrics = {
      requestsPerSecond: 150,
      averageResponseTime: 45,
      errorRate: 0.01,
      activeConnections: 25,
      timestamp: new Date().toISOString()
    };

    expect(() => {
      logger.info({ metrics }, 'Métricas da aplicação');
    }).not.toThrow();
  });

  it('deve logar eventos estruturados para análise', () => {
    const event = {
      event: 'task_created',
      taskId: 123,
      userId: 456,
      timestamp: new Date().toISOString(),
      metadata: {
        title: 'Tarefa de teste',
        completed: false
      }
    };

    expect(() => {
      logger.info(event, 'Evento de criação de tarefa');
    }).not.toThrow();
  });

  it('deve suportar logging de múltiplos módulos simultaneamente', () => {
    const dbLogger = logger.child({ module: 'database' });
    const apiLogger = logger.child({ module: 'api' });
    const authLogger = logger.child({ module: 'auth' });

    expect(() => {
      dbLogger.info('Query executada');
      apiLogger.info('Requisição recebida');
      authLogger.info('Usuário autenticado');
    }).not.toThrow();
  });

  it('deve logar erros de diferentes tipos', () => {
    const validationError = new Error('Validation failed');
    const dbError = new Error('Database connection lost');
    const networkError = new Error('Network timeout');

    expect(() => {
      logger.error({ err: validationError, type: 'validation' }, 'Erro de validação');
      logger.error({ err: dbError, type: 'database' }, 'Erro de banco de dados');
      logger.error({ err: networkError, type: 'network' }, 'Erro de rede');
    }).not.toThrow();
  });
});
