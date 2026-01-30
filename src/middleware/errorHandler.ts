import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Middleware de tratamento de erros
 * 
 * Captura e trata todos os erros que ocorrem durante o processamento de requisições.
 * Formata respostas de erro de forma consistente e loga os erros antes de enviar a resposta.
 * 
 * Tipos de erro tratados:
 * - Erros de validação (400 Bad Request)
 * - Erros de recurso não encontrado (404 Not Found)
 * - Erros de servidor (500 Internal Server Error)
 * 
 * Requisitos atendidos:
 * - 7.1: Retornar 400 Bad Request para erros de validação
 * - 7.2: Retornar 404 Not Found para recursos não encontrados
 * - 7.3: Retornar 500 Internal Server Error para erros de servidor
 * - 7.4: Incluir mensagens de erro descritivas
 * - 7.5: Logar erros antes de enviar resposta
 * - 2.4: Tratar erros de banco de dados graciosamente
 */

/**
 * Interface para erros customizados com status code
 */
export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

/**
 * Middleware principal de tratamento de erros
 * 
 * Este middleware deve ser registrado por último na cadeia de middlewares
 * do Express para capturar todos os erros que ocorrem durante o processamento.
 * 
 * @param err - Erro capturado
 * @param req - Objeto de requisição do Express
 * @param res - Objeto de resposta do Express
 * @param next - Função para passar para o próximo middleware
 * 
 * Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Se a resposta já foi enviada, delega para o handler padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  // Determina o status code baseado no tipo de erro
  const statusCode = err.statusCode || 500;
  
  // Determina o tipo de erro
  let errorType = 'InternalServerError';
  if (statusCode === 400) {
    errorType = 'ValidationError';
  } else if (statusCode === 404) {
    errorType = 'NotFoundError';
  } else if (statusCode === 500) {
    errorType = 'InternalServerError';
  }

  // Loga o erro antes de enviar a resposta (Requisito 7.5)
  if (statusCode >= 500) {
    // Erros de servidor são logados como error com stack trace
    logger.error({
      error: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode
    }, 'Erro interno do servidor');
  } else if (statusCode >= 400) {
    // Erros de cliente são logados como warning
    logger.warn({
      error: err.message,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      details: err.details
    }, 'Erro de requisição do cliente');
  }

  // Formata a resposta de erro de forma consistente (Requisito 7.4)
  const errorResponse: any = {
    error: errorType,
    message: err.message || 'Ocorreu um erro ao processar a requisição'
  };

  // Adiciona detalhes se disponíveis (útil para erros de validação)
  if (err.details) {
    errorResponse.details = err.details;
  }

  // Em desenvolvimento, inclui stack trace para facilitar debugging
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    errorResponse.stack = err.stack;
  }

  // Envia a resposta de erro
  res.status(statusCode).json(errorResponse);
}

/**
 * Middleware para capturar rotas não encontradas (404)
 * 
 * Este middleware deve ser registrado após todas as rotas válidas
 * para capturar requisições para endpoints que não existem.
 * 
 * @param req - Objeto de requisição do Express
 * @param res - Objeto de resposta do Express
 * @param next - Função para passar para o próximo middleware
 * 
 * Requisito: 7.2
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const error: CustomError = new Error(`Rota não encontrada: ${req.method} ${req.originalUrl || req.url}`);
  error.statusCode = 404;
  
  next(error);
}

/**
 * Cria um erro customizado com status code
 * 
 * Função auxiliar para criar erros com status code específico
 * que serão tratados pelo middleware de erro.
 * 
 * @param message - Mensagem de erro
 * @param statusCode - Código de status HTTP
 * @param details - Detalhes adicionais do erro (opcional)
 * @returns Erro customizado
 * 
 * @example
 * ```typescript
 * throw createError('Tarefa não encontrada', 404);
 * throw createError('Dados inválidos', 400, { field: 'title', issue: 'obrigatório' });
 * ```
 */
export function createError(
  message: string,
  statusCode: number,
  details?: any
): CustomError {
  const error: CustomError = new Error(message);
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }
  return error;
}

/**
 * Wrapper assíncrono para rotas Express
 * 
 * Captura erros de funções assíncronas e passa para o middleware de erro.
 * Útil para evitar try-catch em cada rota.
 * 
 * @param fn - Função assíncrona da rota
 * @returns Middleware Express que captura erros
 * 
 * @example
 * ```typescript
 * router.get('/tasks', asyncHandler(async (req, res) => {
 *   const tasks = await taskController.findAll();
 *   res.json(tasks);
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Trata erros de banco de dados
 * 
 * Converte erros específicos do banco de dados em erros HTTP apropriados.
 * 
 * @param error - Erro do banco de dados
 * @returns Erro customizado com status code apropriado
 * 
 * Requisito: 2.4, 2.5
 */
export function handleDatabaseError(error: any): CustomError {
  // Erro de conexão com o banco
  if (error.message && error.message.includes('connection')) {
    return createError(
      'Erro ao conectar com o banco de dados',
      500,
      { type: 'database_connection_error' }
    );
  }

  // Erro de constraint violation (ex: NOT NULL, UNIQUE)
  if (error.code === '23502') { // NOT NULL violation
    return createError(
      'Dados obrigatórios não fornecidos',
      400,
      { type: 'constraint_violation', code: error.code }
    );
  }

  if (error.code === '23505') { // UNIQUE violation
    return createError(
      'Registro duplicado',
      400,
      { type: 'constraint_violation', code: error.code }
    );
  }

  // Erro genérico de banco de dados
  return createError(
    'Erro ao processar operação no banco de dados',
    500,
    { type: 'database_error' }
  );
}
