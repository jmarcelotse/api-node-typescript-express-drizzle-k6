import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { createTaskSchema, updateTaskSchema } from '../types/task.types';
import { logger } from '../config/logger';

/**
 * Middleware genérico de validação usando Zod
 * 
 * Valida o corpo da requisição contra um schema Zod fornecido.
 * Em caso de erro de validação, retorna 400 Bad Request com detalhes dos erros.
 * 
 * @param schema - Schema Zod para validação
 * @returns Middleware Express
 * 
 * Requisitos atendidos:
 * - 4.6: Validação de payloads de requisição
 * - 7.1: Retorno de 400 Bad Request com detalhes de erro
 * - 7.4: Mensagens de erro descritivas
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Valida o corpo da requisição contra o schema
      const validatedData = schema.parse(req.body);
      
      // Substitui req.body pelos dados validados e transformados
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formata os erros de validação do Zod (Zod 4 usa 'issues' ao invés de 'errors')
        const issues = (error as any).issues || [];
        const formattedErrors = issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        // Loga o erro de validação
        logger.warn({
          errors: formattedErrors,
          body: req.body
        }, 'Erro de validação de dados');

        // Retorna resposta 400 com detalhes dos erros
        res.status(400).json({
          error: 'ValidationError',
          message: 'Dados de entrada inválidos',
          details: formattedErrors
        });
        return;
      }

      // Erro inesperado durante validação
      logger.error({ error, message: 'Erro inesperado durante validação' });
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao processar a requisição'
      });
    }
  };
};

/**
 * Middleware para validar criação de tarefa
 * 
 * Valida que o payload contém:
 * - title: obrigatório, string não-vazia, máximo 255 caracteres
 * - description: opcional, string
 * - completed: opcional, boolean
 * 
 * Requisitos atendidos:
 * - 4.6: Validação de payloads de requisição
 * - 7.1: Retorno de 400 com detalhes de erro
 * - 8.2: Validação de title obrigatório (1-255 chars)
 */
export const validateCreateTask = validateRequest(createTaskSchema);

/**
 * Middleware para validar atualização de tarefa
 * 
 * Valida que o payload contém pelo menos um campo válido:
 * - title: opcional, string não-vazia, máximo 255 caracteres
 * - description: opcional, string
 * - completed: opcional, boolean
 * 
 * Requisitos atendidos:
 * - 4.6: Validação de payloads de requisição
 * - 7.1: Retorno de 400 com detalhes de erro
 * - 8.2: Validação de title (1-255 chars) quando fornecido
 */
export const validateUpdateTask = validateRequest(updateTaskSchema);

/**
 * Middleware para validar parâmetro ID
 * 
 * Valida que o parâmetro :id é um número inteiro positivo válido.
 * 
 * Requisitos atendidos:
 * - 4.6: Validação de parâmetros de requisição
 * - 7.1: Retorno de 400 para IDs inválidos
 */
export const validateTaskId = (req: Request, res: Response, next: NextFunction): void => {
  const idParam = req.params.id as string;
  
  // Verifica se contém apenas dígitos (rejeita decimais, negativos, etc)
  if (!/^\d+$/.test(idParam)) {
    logger.warn({ id: idParam }, 'ID de tarefa inválido');
    
    res.status(400).json({
      error: 'ValidationError',
      message: 'ID de tarefa inválido',
      details: [{
        field: 'id',
        message: 'O ID deve ser um número inteiro positivo'
      }]
    });
    return;
  }

  const id = parseInt(idParam, 10);

  if (id <= 0) {
    logger.warn({ id: idParam }, 'ID de tarefa inválido');
    
    res.status(400).json({
      error: 'ValidationError',
      message: 'ID de tarefa inválido',
      details: [{
        field: 'id',
        message: 'O ID deve ser um número inteiro positivo'
      }]
    });
    return;
  }

  // Armazena o ID validado em req.params para uso posterior
  req.params.id = id.toString();
  next();
};
