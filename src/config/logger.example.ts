/**
 * Exemplos de uso do logger
 * 
 * Este arquivo demonstra como usar o logger em diferentes situações
 * da aplicação. NÃO deve ser importado em código de produção.
 */

import { logger } from './logger';

// ============================================
// Exemplo 1: Logging de informações gerais
// ============================================
export function exemploLoggingInfo() {
  // Log simples de informação
  logger.info('Servidor iniciado com sucesso');
  
  // Log com metadata estruturada
  logger.info({ port: 3000, env: 'development' }, 'Servidor escutando na porta 3000');
  
  // Log de operação de banco de dados
  logger.info({ operation: 'SELECT', table: 'tasks', duration: 45 }, 'Query executada');
}

// ============================================
// Exemplo 2: Logging de erros
// ============================================
export function exemploLoggingErro() {
  try {
    // Simula uma operação que pode falhar
    throw new Error('Falha ao conectar ao banco de dados');
  } catch (error) {
    // Log de erro com stack trace
    logger.error({ err: error }, 'Erro ao processar requisição');
    
    // Log de erro com contexto adicional
    logger.error(
      { 
        err: error,
        userId: 123,
        operation: 'createTask',
        timestamp: new Date().toISOString()
      },
      'Falha ao criar tarefa'
    );
  }
}

// ============================================
// Exemplo 3: Logging de warnings
// ============================================
export function exemploLoggingWarning() {
  // Warning sobre performance
  logger.warn({ responseTime: 5000, endpoint: '/api/tasks' }, 'Resposta lenta detectada');
  
  // Warning sobre recurso próximo do limite
  logger.warn({ connections: 95, maxConnections: 100 }, 'Pool de conexões quase cheio');
  
  // Warning sobre uso de feature deprecated
  logger.warn({ feature: 'oldAPI', replacement: 'newAPI' }, 'Usando API deprecated');
}

// ============================================
// Exemplo 4: Logging de debug
// ============================================
export function exemploLoggingDebug() {
  // Debug só aparece em desenvolvimento (LOG_LEVEL=debug)
  logger.debug({ requestBody: { title: 'Nova tarefa' } }, 'Dados recebidos na requisição');
  
  // Debug de estado interno
  logger.debug({ state: { connected: true, poolSize: 10 } }, 'Estado da conexão');
  
  // Debug de fluxo de execução
  logger.debug({ step: 'validation', valid: true }, 'Validação concluída');
}

// ============================================
// Exemplo 5: Logging de requisições HTTP
// ============================================
export function exemploLoggingRequisicao() {
  const requestData = {
    method: 'POST',
    path: '/api/tasks',
    statusCode: 201,
    responseTime: 45,
    userAgent: 'Mozilla/5.0',
    ip: '192.168.1.1'
  };
  
  logger.info(requestData, 'Requisição HTTP processada');
}

// ============================================
// Exemplo 6: Child Logger (logger contextual)
// ============================================
export function exemploChildLogger() {
  // Cria um logger específico para o módulo de banco de dados
  const dbLogger = logger.child({ module: 'database' });
  
  dbLogger.info('Conexão estabelecida');
  dbLogger.error({ err: new Error('Query timeout') }, 'Erro na query');
  
  // Cria um logger específico para uma requisição
  const requestLogger = logger.child({ requestId: 'req-123', userId: 456 });
  
  requestLogger.info('Iniciando processamento');
  requestLogger.info('Validação concluída');
  requestLogger.info('Tarefa criada com sucesso');
}

// ============================================
// Exemplo 7: Logging em diferentes camadas
// ============================================

// Na camada de rotas
export function exemploLoggingRota() {
  logger.info({ method: 'GET', path: '/api/tasks' }, 'Rota acessada');
}

// Na camada de controller
export function exemploLoggingController() {
  logger.info({ action: 'findAll', entity: 'task' }, 'Buscando todas as tarefas');
}

// Na camada de banco de dados
export function exemploLoggingDatabase() {
  logger.info({ query: 'SELECT * FROM tasks', duration: 23 }, 'Query executada');
}

// ============================================
// Exemplo 8: Logging de ciclo de vida da aplicação
// ============================================
export function exemploLoggingCicloVida() {
  // Startup
  logger.info('Aplicação iniciando...');
  logger.info({ version: '1.0.0', env: 'production' }, 'Configuração carregada');
  logger.info('Conectando ao banco de dados...');
  logger.info({ host: 'localhost', port: 5432 }, 'Conexão estabelecida');
  logger.info({ port: 3000 }, 'Servidor pronto para receber requisições');
  
  // Shutdown
  logger.info('Recebido sinal de shutdown');
  logger.info('Fechando conexões ativas...');
  logger.info('Aplicação encerrada com sucesso');
}

// ============================================
// Exemplo 9: Logging de métricas
// ============================================
export function exemploLoggingMetricas() {
  logger.info({
    metrics: {
      requestsPerSecond: 150,
      averageResponseTime: 45,
      errorRate: 0.01,
      activeConnections: 25
    }
  }, 'Métricas da aplicação');
}

// ============================================
// Exemplo 10: Logging estruturado para análise
// ============================================
export function exemploLoggingEstruturado() {
  // Formato consistente facilita parsing e análise
  logger.info({
    event: 'task_created',
    taskId: 123,
    userId: 456,
    timestamp: new Date().toISOString(),
    metadata: {
      title: 'Nova tarefa',
      completed: false
    }
  }, 'Tarefa criada');
  
  logger.info({
    event: 'task_updated',
    taskId: 123,
    userId: 456,
    timestamp: new Date().toISOString(),
    changes: {
      completed: { from: false, to: true }
    }
  }, 'Tarefa atualizada');
}
