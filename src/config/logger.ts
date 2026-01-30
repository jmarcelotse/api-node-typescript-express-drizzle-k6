import pino from 'pino';

/**
 * Configuração do logger usando Pino
 * 
 * O logger fornece diferentes níveis de log:
 * - debug: Informações detalhadas para debugging (apenas em desenvolvimento)
 * - info: Informações gerais sobre operações da aplicação
 * - warn: Avisos sobre situações que merecem atenção
 * - error: Erros que ocorreram durante a execução
 * 
 * Formato estruturado de logs em JSON para facilitar parsing e análise
 * 
 * Requirements: 5.1, 5.5
 */

// Determina o nível de log baseado no ambiente
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Configuração do logger
const logger = pino({
  level: logLevel,
  
  // Formato estruturado de logs
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  
  // Configuração de transporte para desenvolvimento (logs mais legíveis)
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: '{msg}',
    }
  } : undefined,
  
  // Timestamp em formato ISO 8601
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  
  // Informações base incluídas em todos os logs
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});

/**
 * Exporta o logger configurado
 * 
 * Uso:
 * ```typescript
 * import { logger } from './config/logger';
 * 
 * logger.info('Servidor iniciado', { port: 3000 });
 * logger.error('Erro ao conectar ao banco', { error: err.message });
 * logger.warn('Conexão lenta detectada', { responseTime: 5000 });
 * logger.debug('Dados de debug', { data: someData });
 * ```
 */
export { logger };
