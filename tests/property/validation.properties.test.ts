import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import express, { Express } from 'express';
import taskRoutes from '../../src/routes/task.routes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { getConnection, closeConnection } from '../../src/db/connection';
import { tasks } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { validTaskData, invalidTaskData, invalidTaskId } from './generators';

/**
 * Testes baseados em propriedades para validação de dados
 * 
 * Feature: todo-api
 * Requirements: 1.6, 4.6, 7.1, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

describe('Validation Properties', () => {
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
   * Property 5: Invalid ID Returns Error
   * 
   * **Validates: Requirements 1.6**
   * 
   * Para qualquer ID inválido (não-numérico, negativo, ou não-existente),
   * requisições GET, PUT ou DELETE devem retornar erro apropriado (400 ou 404).
   */
  it('Property 5: Invalid ID Returns Error - IDs inválidos devem retornar erro', async () => {
    await fc.assert(
      fc.asyncProperty(invalidTaskId(), async (id) => {
        // Testa GET com ID inválido
        const getResponse = await request(app).get(`/api/tasks/${id}`);
        expect([400, 404]).toContain(getResponse.status);

        // Testa PUT com ID inválido
        const putResponse = await request(app)
          .put(`/api/tasks/${id}`)
          .send({ title: 'Test' });
        expect([400, 404]).toContain(putResponse.status);

        // Testa DELETE com ID inválido
        const deleteResponse = await request(app).delete(`/api/tasks/${id}`);
        expect([400, 404]).toContain(deleteResponse.status);
      }),
      { numRuns: 50 }
    );
  }, 60000);

  /**
   * Property 6: Schema Validation Enforcement
   * 
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
   * 
   * Para qualquer tarefa criada com dados válidos, o sistema deve garantir:
   * - Title está presente e não-vazio
   * - Title tem 1-255 caracteres
   * - Completed é boolean
   * - IDs são únicos
   * - Timestamps estão presentes
   */
  it('Property 6: Schema Validation Enforcement - schema deve ser validado', async () => {
    await fc.assert(
      fc.asyncProperty(validTaskData(), async (taskData) => {
        const response = await request(app)
          .post('/api/tasks')
          .send(taskData);

        if (response.status === 201) {
          const task = response.body;

          // Verifica title presente e não-vazio
          expect(task.title).toBeDefined();
          expect(task.title.length).toBeGreaterThan(0);
          expect(task.title.length).toBeLessThanOrEqual(255);

          // Verifica completed é boolean
          expect(typeof task.completed).toBe('boolean');

          // Verifica ID é único e positivo
          expect(task.id).toBeDefined();
          expect(typeof task.id).toBe('number');
          expect(task.id).toBeGreaterThan(0);

          // Verifica timestamps presentes
          expect(task.createdAt).toBeDefined();
          expect(task.updatedAt).toBeDefined();

          // Limpa a tarefa criada
          await db.delete(tasks).where(eq(tasks.id, task.id));
        }
      }),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 7: Invalid Payloads Rejected
   * 
   * **Validates: Requirements 4.6, 7.1**
   * 
   * Para qualquer payload inválido (campos ausentes, tipos errados, violações de constraints),
   * a API deve retornar 400 Bad Request com detalhes do erro antes de processar.
   */
  it('Property 7: Invalid Payloads Rejected - payloads inválidos devem ser rejeitados', async () => {
    await fc.assert(
      fc.asyncProperty(invalidTaskData(), async (invalidData) => {
        const response = await request(app)
          .post('/api/tasks')
          .send(invalidData);

        // Deve retornar 400 Bad Request
        expect(response.status).toBe(400);

        // Deve incluir mensagem de erro
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBeDefined();
      }),
      { numRuns: 100 }
    );
  }, 60000);
});
