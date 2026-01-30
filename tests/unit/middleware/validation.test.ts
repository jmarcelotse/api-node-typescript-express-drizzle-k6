import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { 
  validateCreateTask, 
  validateUpdateTask, 
  validateTaskId 
} from '../../../src/middleware/validation';

/**
 * Testes unitários para middleware de validação
 * 
 * Valida que o middleware de validação:
 * - Aceita dados válidos e chama next()
 * - Rejeita dados inválidos com 400 e detalhes de erro
 * - Valida corretamente os campos obrigatórios e opcionais
 * - Valida limites de tamanho de string
 * - Valida tipos de dados
 */

describe('Middleware de Validação', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {}
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    mockNext = vi.fn();
  });

  describe('validateCreateTask', () => {
    it('deve aceitar dados válidos com todos os campos', () => {
      mockRequest.body = {
        title: 'Tarefa de teste',
        description: 'Descrição da tarefa',
        completed: false
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve aceitar dados válidos apenas com title', () => {
      mockRequest.body = {
        title: 'Tarefa mínima'
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve remover espaços em branco do title', () => {
      mockRequest.body = {
        title: '  Tarefa com espaços  '
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.title).toBe('Tarefa com espaços');
    });

    it('deve rejeitar requisição sem title', () => {
      mockRequest.body = {
        description: 'Sem título'
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          message: 'Dados de entrada inválidos',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'title'
            })
          ])
        })
      );
    });

    it('deve rejeitar title vazio', () => {
      mockRequest.body = {
        title: ''
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.stringContaining('vazio')
            })
          ])
        })
      );
    });

    it('deve rejeitar title com mais de 255 caracteres', () => {
      mockRequest.body = {
        title: 'a'.repeat(256)
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.stringContaining('255')
            })
          ])
        })
      );
    });

    it('deve rejeitar title que não é string', () => {
      mockRequest.body = {
        title: 123
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.stringContaining('string')
            })
          ])
        })
      );
    });

    it('deve rejeitar completed que não é boolean', () => {
      mockRequest.body = {
        title: 'Tarefa válida',
        completed: 'true'
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'completed',
              message: expect.stringContaining('boolean')
            })
          ])
        })
      );
    });

    it('deve aceitar title com exatamente 255 caracteres', () => {
      mockRequest.body = {
        title: 'a'.repeat(255)
      };

      validateCreateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('validateUpdateTask', () => {
    it('deve aceitar atualização apenas de title', () => {
      mockRequest.body = {
        title: 'Novo título'
      };

      validateUpdateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve aceitar atualização apenas de description', () => {
      mockRequest.body = {
        description: 'Nova descrição'
      };

      validateUpdateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve aceitar atualização apenas de completed', () => {
      mockRequest.body = {
        completed: true
      };

      validateUpdateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve aceitar atualização de múltiplos campos', () => {
      mockRequest.body = {
        title: 'Título atualizado',
        description: 'Descrição atualizada',
        completed: true
      };

      validateUpdateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar atualização sem nenhum campo', () => {
      mockRequest.body = {};

      validateUpdateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          message: expect.stringContaining('inválidos')
        })
      );
    });

    it('deve rejeitar title vazio na atualização', () => {
      mockRequest.body = {
        title: ''
      };

      validateUpdateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('deve rejeitar title com mais de 255 caracteres na atualização', () => {
      mockRequest.body = {
        title: 'a'.repeat(256)
      };

      validateUpdateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('deve remover espaços em branco do title na atualização', () => {
      mockRequest.body = {
        title: '  Título com espaços  '
      };

      validateUpdateTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.title).toBe('Título com espaços');
    });
  });

  describe('validateTaskId', () => {
    it('deve aceitar ID numérico positivo válido', () => {
      mockRequest.params = { id: '123' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve aceitar ID 1', () => {
      mockRequest.params = { id: '1' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar ID zero', () => {
      mockRequest.params = { id: '0' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          message: 'ID de tarefa inválido',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'id',
              message: expect.stringContaining('positivo')
            })
          ])
        })
      );
    });

    it('deve rejeitar ID negativo', () => {
      mockRequest.params = { id: '-5' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('deve rejeitar ID não-numérico', () => {
      mockRequest.params = { id: 'abc' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('deve rejeitar ID decimal', () => {
      mockRequest.params = { id: '12.5' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('deve rejeitar ID vazio', () => {
      mockRequest.params = { id: '' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
