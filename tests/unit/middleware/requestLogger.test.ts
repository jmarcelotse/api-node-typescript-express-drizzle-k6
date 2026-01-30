import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../../../src/middleware/requestLogger';
import { logger } from '../../../src/config/logger';

/**
 * Testes unitários para o middleware de logging de requisições
 * 
 * Valida que o middleware:
 * - Loga todas as requisições HTTP
 * - Inclui método, URL, status code e tempo de resposta
 * - Não interfere no fluxo normal da requisição
 * 
 * Requirements: 5.2
 */

describe('Request Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let loggerInfoSpy: any;

  beforeEach(() => {
    // Mock da requisição
    mockRequest = {
      method: 'GET',
      url: '/api/tasks',
      originalUrl: '/api/tasks',
      get: vi.fn((header: string) => {
        if (header === 'user-agent') return 'test-agent';
        return undefined;
      }),
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };

    // Mock da resposta
    mockResponse = {
      statusCode: 200,
      end: vi.fn(function(this: Response, ...args: any[]) {
        return this;
      }) as any,
    };

    // Mock da função next
    mockNext = vi.fn();

    // Spy no logger.info
    loggerInfoSpy = vi.spyOn(logger, 'info');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve chamar next() para passar para o próximo middleware', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('deve logar informações da requisição quando a resposta é enviada', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Simula o envio da resposta
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledTimes(1);
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/tasks',
        statusCode: 200,
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve incluir o método HTTP no log', () => {
    mockRequest.method = 'POST';
    
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve incluir a URL da requisição no log', () => {
    mockRequest.originalUrl = '/api/tasks/123';
    mockRequest.url = '/api/tasks/123';
    
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/tasks/123',
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve incluir o status code da resposta no log', () => {
    mockResponse.statusCode = 201;
    
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 201,
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve incluir o tempo de resposta no log', async () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Simula um pequeno delay
    const delay = 50;
    
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        mockResponse.end!();
        resolve();
      }, delay);
    });
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        responseTime: expect.stringMatching(/\d+ms/),
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve incluir o user agent no log', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: 'test-agent',
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve incluir o IP do cliente no log', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '127.0.0.1',
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve usar req.socket.remoteAddress se req.ip não estiver disponível', () => {
    mockRequest.ip = undefined;
    mockRequest.socket = {
      remoteAddress: '192.168.1.1',
    } as any;
    
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '192.168.1.1',
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve usar req.url se req.originalUrl não estiver disponível', () => {
    mockRequest.originalUrl = undefined;
    mockRequest.url = '/api/tasks';
    
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/tasks',
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve logar requisições com diferentes métodos HTTP', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    methods.forEach((method) => {
      vi.clearAllMocks();
      mockRequest.method = method;
      
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      mockResponse.end!();
      
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method,
        }),
        'Requisição HTTP processada'
      );
    });
  });

  it('deve logar requisições com diferentes status codes', () => {
    const statusCodes = [200, 201, 204, 400, 404, 500];
    
    statusCodes.forEach((statusCode) => {
      vi.clearAllMocks();
      mockResponse.statusCode = statusCode;
      
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      mockResponse.end!();
      
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode,
        }),
        'Requisição HTTP processada'
      );
    });
  });

  it('deve preservar o comportamento original de res.end()', () => {
    const originalEnd = mockResponse.end;
    
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Verifica que res.end foi substituído
    expect(mockResponse.end).not.toBe(originalEnd);
    
    // Chama res.end e verifica que funciona
    const result = mockResponse.end!();
    
    // Verifica que retorna a resposta (para chaining)
    expect(result).toBe(mockResponse);
  });

  it('deve calcular o tempo de resposta corretamente', async () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    
    // Simula um delay de 100ms
    const delay = 100;
    
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        mockResponse.end!();
        resolve();
      }, delay);
    });
    
    const logCall = loggerInfoSpy.mock.calls[0];
    const responseTimeStr = logCall[0].responseTime;
    const responseTime = parseInt(responseTimeStr.replace('ms', ''));
    
    // Verifica que o tempo está próximo do delay (com margem de erro)
    expect(responseTime).toBeGreaterThanOrEqual(delay - 10);
    expect(responseTime).toBeLessThanOrEqual(delay + 50);
  });

  it('deve logar requisições para diferentes endpoints', () => {
    const endpoints = [
      '/api/tasks',
      '/api/tasks/123',
      '/api/tasks/123/complete',
      '/health',
      '/api/users',
    ];
    
    endpoints.forEach((endpoint) => {
      vi.clearAllMocks();
      mockRequest.url = endpoint;
      mockRequest.originalUrl = endpoint;
      
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      mockResponse.end!();
      
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: endpoint,
        }),
        'Requisição HTTP processada'
      );
    });
  });

  it('deve funcionar mesmo sem user agent', () => {
    mockRequest.get = vi.fn(() => undefined);
    
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
    mockResponse.end!();
    
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: undefined,
      }),
      'Requisição HTTP processada'
    );
  });

  it('não deve interferir no fluxo normal da aplicação', () => {
    const middlewareChain = [
      requestLogger,
      (req: Request, res: Response, next: NextFunction) => {
        next();
      },
      (req: Request, res: Response, next: NextFunction) => {
        res.statusCode = 200;
        res.end();
      },
    ];
    
    let currentIndex = 0;
    const chainNext: NextFunction = () => {
      currentIndex++;
      if (currentIndex < middlewareChain.length) {
        middlewareChain[currentIndex](
          mockRequest as Request,
          mockResponse as Response,
          chainNext
        );
      }
    };
    
    middlewareChain[0](mockRequest as Request, mockResponse as Response, chainNext);
    
    // Verifica que todos os middlewares foram executados
    expect(currentIndex).toBe(2);
    expect(loggerInfoSpy).toHaveBeenCalledTimes(1);
  });
});
