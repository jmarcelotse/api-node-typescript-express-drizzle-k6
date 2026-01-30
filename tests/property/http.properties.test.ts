import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import express, { Express } from 'express';
import taskRoutes from '../../src/routes/task.routes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { getConnection, closeConnection } from '../../src/db/connection';
import { tasks } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { validTaskData } from './generators';

/**
 * Testes baseados em propriedades para protocolo HTTP
 * 
 * Feature: todo-api
 * Requirements: 4.5, 7.2, 7.3, 7.4
 */

describe('HTTP Properties', () => {
  let app: Express;
  let db: any;

  beforeAll(async () => {
    db = await getConnection();
    
    app = express();
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await closeConnection();
  });

  /**
   * Property 9: Appropriate Status Codes
   * 
   * **Validates: Requirements 4.5**
   * 
   * Para qualquer operação da API, a resposta deve usar status codes HTTP apropriados:
   * - 200 para GET/PUT bem-sucedidos
   * - 201 para POST bem-sucedido
   * - 204 para DELETE bem-sucedido
   * - 400 para erros de validação
   * - 404 para não encontrado
   */
  it('Property 9: Appropriate Status Codes - status codes devem ser apropriados', async () => {
    await fc.assert(
      fc.asyncProperty(validTaskData(), async (taskData) => {
        // POST deve retornar 201
        const postResponse = await request(app)
          .post('/api/tasks')
          .send(taskData);
        expect(postResponse.status).toBe(201);

        const taskId = postResponse.body.id;

        // GET deve retornar 200
        const getResponse = await request(app).get(`/api/tasks/${taskId}`);
        expect(getResponse.status).toBe(200);

        // PUT deve retornar 200
        const putResponse = await request(app)
          .put(`/api/tasks/${taskId}`)
          .send({ title: 'Updated' });
        expect(putResponse.status).toBe(200);

        // DELETE deve retornar 204
        const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`);
        expect(deleteResponse.status).toBe(204);

        // GET após DELETE deve retornar 404
        const notFoundResponse = await request(app).get(`/api/tasks/${taskId}`);
        expect(notFoundResponse.status).toBe(404);
      }),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Property 10: Error Responses Include Messages
   * 
   * **Validates: Requirements 7.4**
   * 
   * Para qualquer condição de erro (validação, não encontrado, erro de servidor),
   * a resposta da API deve incluir uma mensagem descritiva explicando o que deu errado.
   */
  it('Property 10: Error Responses Include Messages - erros devem ter mensagens', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 999999, max: 9999999 }), async (nonExistentId) => {
        // Tenta acessar tarefa inexistente
        const response = await request(app).get(`/api/tasks/${nonExistentId}`);

        // Deve retornar erro
        expect(response.status).toBeGreaterThanOrEqual(400);

        // Deve incluir mensagem de erro
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBeDefined();
        expect(typeof response.body.message).toBe('string');
        expect(response.body.message.length).toBeGreaterThan(0);
      }),
      { numRuns: 50 }
    );
  }, 60000);

  /**
   * Property 11: Not Found Returns 404
   * 
   * **Validates: Requirements 7.2**
   * 
   * Para qualquer requisição de recurso não-existente (ID de tarefa que não existe),
   * a API deve retornar 404 Not Found.
   */
  it('Property 11: Not Found Returns 404 - recursos inexistentes devem retornar 404', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 999999, max: 9999999 }), async (nonExistentId) => {
        const response = await request(app).get(`/api/tasks/${nonExistentId}`);
        expect(response.status).toBe(404);
      }),
      { numRuns: 100 }
    );
  }, 60000);
});
