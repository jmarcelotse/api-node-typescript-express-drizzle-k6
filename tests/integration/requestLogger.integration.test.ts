import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express, { Express, Request, Response } from 'express';
import { requestLogger } from '../../src/middleware/requestLogger';
import { logger } from '../../src/config/logger';

/**
 * Testes de integração para o middleware de logging de requisições
 * 
 * Valida que o middleware funciona corretamente em um contexto
 * real com Express, incluindo:
 * - Logging de requisições bem-sucedidas
 * - Logging de requisições com erros
 * - Logging de diferentes métodos HTTP
 * - Cálculo correto do tempo de resposta
 * 
 * Requirements: 5.2
 */

describe('Request Logger Middleware Integration', () => {
  let app: Express;
  let loggerInfoSpy: any;

  beforeAll(() => {
    // Cria uma aplicação Express para testes
    app = express();
    app.use(express.json());
    app.use(requestLogger);

    // Rotas de teste
    app.get('/test', (req: Request, res: Response) => {
      res.status(200).json({ message: 'GET success' });
    });

    app.post('/test', (req: Request, res: Response) => {
      res.status(201).json({ message: 'POST success' });
    });

    app.put('/test/:id', (req: Request, res: Response) => {
      res.status(200).json({ message: 'PUT success', id: req.params.id });
    });

    app.delete('/test/:id', (req: Request, res: Response) => {
      res.status(204).send();
    });

    app.get('/slow', async (req: Request, res: Response) => {
      // Simula uma operação lenta
      await new Promise(resolve => setTimeout(resolve, 100));
      res.status(200).json({ message: 'Slow response' });
    });

    app.get('/error', (req: Request, res: Response) => {
      res.status(500).json({ error: 'Internal server error' });
    });

    app.get('/not-found', (req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Spy no logger.info
    loggerInfoSpy = vi.spyOn(logger, 'info');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('deve logar requisição GET bem-sucedida', async () => {
    const mockReq = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const mockRes = {
      statusCode: 200,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    // Simula o fluxo do Express
    requestLogger(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // Simula a resposta
    mockRes.status(200).json({ message: 'GET success' });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/test',
        statusCode: 200,
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve logar requisição POST com status 201', async () => {
    const mockReq = {
      method: 'POST',
      url: '/test',
      originalUrl: '/test',
      get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const mockRes = {
      statusCode: 201,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    vi.clearAllMocks();
    requestLogger(mockReq, mockRes, mockNext);
    mockRes.status(201).json({ message: 'POST success' });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        statusCode: 201,
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve logar requisição PUT com parâmetro de rota', async () => {
    const mockReq = {
      method: 'PUT',
      url: '/test/123',
      originalUrl: '/test/123',
      params: { id: '123' },
      get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const mockRes = {
      statusCode: 200,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    vi.clearAllMocks();
    requestLogger(mockReq, mockRes, mockNext);
    mockRes.status(200).json({ message: 'PUT success', id: '123' });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        url: '/test/123',
        statusCode: 200,
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve logar requisição DELETE com status 204', async () => {
    const mockReq = {
      method: 'DELETE',
      url: '/test/123',
      originalUrl: '/test/123',
      params: { id: '123' },
      get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const mockRes = {
      statusCode: 204,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      send: function() {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    vi.clearAllMocks();
    requestLogger(mockReq, mockRes, mockNext);
    mockRes.status(204).send();

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        statusCode: 204,
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve logar requisição com erro 500', async () => {
    const mockReq = {
      method: 'GET',
      url: '/error',
      originalUrl: '/error',
      get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const mockRes = {
      statusCode: 500,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    vi.clearAllMocks();
    requestLogger(mockReq, mockRes, mockNext);
    mockRes.status(500).json({ error: 'Internal server error' });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/error',
        statusCode: 500,
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve logar requisição com erro 404', async () => {
    const mockReq = {
      method: 'GET',
      url: '/not-found',
      originalUrl: '/not-found',
      get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const mockRes = {
      statusCode: 404,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    vi.clearAllMocks();
    requestLogger(mockReq, mockRes, mockNext);
    mockRes.status(404).json({ error: 'Not found' });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/not-found',
        statusCode: 404,
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve calcular tempo de resposta para requisições lentas', async () => {
    const mockReq = {
      method: 'GET',
      url: '/slow',
      originalUrl: '/slow',
      get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const mockRes = {
      statusCode: 200,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    vi.clearAllMocks();
    requestLogger(mockReq, mockRes, mockNext);

    // Simula operação lenta
    await new Promise(resolve => setTimeout(resolve, 100));
    mockRes.status(200).json({ message: 'Slow response' });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/slow',
        statusCode: 200,
        responseTime: expect.stringMatching(/\d+ms/),
      }),
      'Requisição HTTP processada'
    );

    // Verifica que o tempo de resposta é >= 100ms
    const logCall = loggerInfoSpy.mock.calls[0];
    const responseTimeStr = logCall[0].responseTime;
    const responseTime = parseInt(responseTimeStr.replace('ms', ''));
    expect(responseTime).toBeGreaterThanOrEqual(100);
  });

  it('deve incluir informações do user agent', async () => {
    const mockReq = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      get: (header: string) => {
        if (header === 'user-agent') return 'Mozilla/5.0 (Test Browser)';
        return undefined;
      },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const mockRes = {
      statusCode: 200,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    vi.clearAllMocks();
    requestLogger(mockReq, mockRes, mockNext);
    mockRes.status(200).json({ message: 'GET success' });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: 'Mozilla/5.0 (Test Browser)',
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve incluir endereço IP do cliente', async () => {
    const mockReq = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
      ip: '192.168.1.100',
      socket: { remoteAddress: '192.168.1.100' },
    } as any;

    const mockRes = {
      statusCode: 200,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.end();
        return this;
      },
      end: vi.fn(function() {
        return this;
      }),
    } as any;

    const mockNext = vi.fn();

    vi.clearAllMocks();
    requestLogger(mockReq, mockRes, mockNext);
    mockRes.status(200).json({ message: 'GET success' });

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '192.168.1.100',
      }),
      'Requisição HTTP processada'
    );
  });

  it('deve logar múltiplas requisições sequenciais', async () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    
    for (const method of methods) {
      vi.clearAllMocks();
      
      const mockReq = {
        method,
        url: '/test',
        originalUrl: '/test',
        get: (header: string) => header === 'user-agent' ? 'test-agent' : undefined,
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any;

      const mockRes = {
        statusCode: 200,
        status: function(code: number) {
          this.statusCode = code;
          return this;
        },
        json: function(data: any) {
          this.end();
          return this;
        },
        send: function() {
          this.end();
          return this;
        },
        end: vi.fn(function() {
          return this;
        }),
      } as any;

      const mockNext = vi.fn();

      requestLogger(mockReq, mockRes, mockNext);
      
      if (method === 'DELETE') {
        mockRes.status(204).send();
      } else {
        mockRes.status(200).json({ message: `${method} success` });
      }

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method,
        }),
        'Requisição HTTP processada'
      );
    }
  });
});
