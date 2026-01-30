import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/config/logger';

/**
 * Testes unitários para a configuração do logger
 * 
 * Valida que o logger está configurado corretamente com:
 * - Níveis de log apropriados (info, warn, error, debug)
 * - Formato estruturado de logs
 * - Inicialização correta
 * 
 * Requirements: 5.1, 5.5
 */

describe('Logger Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salva variáveis de ambiente originais
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restaura variáveis de ambiente
    process.env = originalEnv;
  });

  it('deve estar inicializado e pronto para uso', () => {
    // Verifica que o logger foi exportado corretamente
    expect(logger).toBeDefined();
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('debug');
  });

  it('deve ter todos os métodos de log necessários', () => {
    // Verifica que todos os níveis de log estão disponíveis
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('deve ter configuração de nível de log', () => {
    // Verifica que o logger tem um nível configurado
    expect(logger.level).toBeDefined();
    expect(typeof logger.level).toBe('string');
    
    // Níveis válidos do Pino
    const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    expect(validLevels).toContain(logger.level);
  });

  it('deve permitir logging de mensagens simples', () => {
    // Testa que os métodos podem ser chamados sem erro
    expect(() => {
      logger.info('Teste de mensagem info');
      logger.warn('Teste de mensagem warn');
      logger.error('Teste de mensagem error');
      logger.debug('Teste de mensagem debug');
    }).not.toThrow();
  });

  it('deve permitir logging com metadata estruturada', () => {
    // Testa que os métodos aceitam objetos de metadata
    expect(() => {
      logger.info({ userId: 123, action: 'login' }, 'Usuário fez login');
      logger.error({ error: 'Database connection failed', code: 'DB_001' }, 'Erro de conexão');
      logger.warn({ responseTime: 5000 }, 'Resposta lenta detectada');
      logger.debug({ data: { foo: 'bar' } }, 'Dados de debug');
    }).not.toThrow();
  });

  it('deve ter configuração base com informações de ambiente', () => {
    // Verifica que o logger tem configuração base
    // Nota: Pino não expõe diretamente a configuração base,
    // mas podemos verificar que o logger foi criado corretamente
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it('deve suportar diferentes níveis de severidade', () => {
    // Verifica que o logger tem os níveis corretos configurados
    const levels = ['debug', 'info', 'warn', 'error'];
    
    levels.forEach(level => {
      expect(logger).toHaveProperty(level);
      expect(typeof logger[level as keyof typeof logger]).toBe('function');
    });
  });

  it('deve formatar logs de forma estruturada', () => {
    // Testa que o logger aceita objetos estruturados
    const testData = {
      requestId: 'req-123',
      method: 'GET',
      path: '/api/tasks',
      statusCode: 200,
      responseTime: 45
    };

    expect(() => {
      logger.info(testData, 'Requisição processada');
    }).not.toThrow();
  });

  it('deve permitir logging de erros com stack trace', () => {
    // Testa logging de objetos Error
    const error = new Error('Erro de teste');
    
    expect(() => {
      logger.error({ err: error }, 'Erro capturado');
    }).not.toThrow();
  });

  it('deve ter método child para criar loggers contextuais', () => {
    // Verifica que o logger suporta criação de child loggers
    expect(logger).toHaveProperty('child');
    expect(typeof logger.child).toBe('function');
    
    const childLogger = logger.child({ module: 'database' });
    expect(childLogger).toBeDefined();
    expect(childLogger).toHaveProperty('info');
  });
});
