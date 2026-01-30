import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { getConnection, closeConnection } from '../../src/db/connection';
import { tasks } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { validTaskData, taskList } from './generators';

/**
 * Testes baseados em propriedades para operações CRUD
 * 
 * Estes testes validam propriedades universais que devem ser verdadeiras
 * para todas as entradas válidas, usando geração automática de dados de teste.
 * 
 * Feature: todo-api
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

describe('CRUD Properties', () => {
  let db: any;

  beforeAll(async () => {
    db = await getConnection();
  });

  afterAll(async () => {
    await closeConnection();
  });

  /**
   * Property 1: Task Creation Round Trip
   * 
   * **Validates: Requirements 1.1, 1.3**
   * 
   * Para qualquer dado válido de tarefa (title, description opcional, completed opcional),
   * criar uma tarefa deve retornar um objeto com ID único e os mesmos dados,
   * e recuperar essa tarefa por ID deve retornar dados equivalentes.
   */
  it('Property 1: Task Creation Round Trip - criar e recuperar tarefa deve preservar dados', async () => {
    await fc.assert(
      fc.asyncProperty(validTaskData(), async (taskData) => {
        // Cria a tarefa
        const [created] = await db.insert(tasks).values({
          title: taskData.title,
          description: taskData.description ?? null,
          completed: taskData.completed ?? false,
        }).returning();

        // Verifica que foi criada com ID
        expect(created.id).toBeDefined();
        expect(typeof created.id).toBe('number');
        expect(created.id).toBeGreaterThan(0);

        // Recupera a tarefa por ID
        const [retrieved] = await db.select().from(tasks).where(eq(tasks.id, created.id));

        // Verifica que os dados são equivalentes
        expect(retrieved).toBeDefined();
        expect(retrieved.id).toBe(created.id);
        expect(retrieved.title).toBe(taskData.title);
        expect(retrieved.description).toBe(taskData.description ?? null);
        expect(retrieved.completed).toBe(taskData.completed ?? false);
        expect(retrieved.createdAt).toBeDefined();
        expect(retrieved.updatedAt).toBeDefined();

        // Limpa a tarefa criada
        await db.delete(tasks).where(eq(tasks.id, created.id));
      }),
      { numRuns: 100 }
    );
  }, 60000); // Timeout de 60 segundos para 100 iterações

  /**
   * Property 2: Task List Completeness
   * 
   * **Validates: Requirements 1.2**
   * 
   * Para qualquer conjunto de tarefas criadas, listar todas as tarefas
   * deve retornar todas as tarefas que foram criadas e não deletadas,
   * com o count correspondendo ao número de tarefas.
   */
  it('Property 2: Task List Completeness - listar deve retornar todas as tarefas criadas', async () => {
    await fc.assert(
      fc.asyncProperty(taskList(1, 10), async (taskDataList) => {
        // Limpa tarefas existentes para este teste
        await db.delete(tasks);

        // Cria todas as tarefas
        const createdIds: number[] = [];
        for (const taskData of taskDataList) {
          const [created] = await db.insert(tasks).values({
            title: taskData.title,
            description: taskData.description ?? null,
            completed: taskData.completed ?? false,
          }).returning();
          createdIds.push(created.id);
        }

        // Lista todas as tarefas
        const allTasks = await db.select().from(tasks);

        // Verifica que o count corresponde
        expect(allTasks.length).toBe(taskDataList.length);

        // Verifica que todas as tarefas criadas estão na lista
        for (const id of createdIds) {
          const found = allTasks.find((t: any) => t.id === id);
          expect(found).toBeDefined();
        }

        // Limpa as tarefas criadas
        await db.delete(tasks);
      }),
      { numRuns: 50 } // Menos iterações pois cria múltiplas tarefas
    );
  }, 120000); // Timeout de 120 segundos

  /**
   * Property 3: Task Update Preserves Identity
   * 
   * **Validates: Requirements 1.4**
   * 
   * Para qualquer tarefa existente e dados de atualização válidos,
   * atualizar a tarefa deve preservar o ID e createdAt timestamp,
   * enquanto atualiza apenas os campos especificados e o updatedAt timestamp.
   */
  it('Property 3: Task Update Preserves Identity - atualizar deve preservar ID e createdAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        validTaskData(),
        validTaskData(),
        async (initialData, updateData) => {
          // Cria a tarefa inicial
          const [created] = await db.insert(tasks).values({
            title: initialData.title,
            description: initialData.description ?? null,
            completed: initialData.completed ?? false,
          }).returning();

          const originalId = created.id;
          const originalCreatedAt = created.createdAt;

          // Aguarda um momento para garantir que updatedAt será diferente
          await new Promise(resolve => setTimeout(resolve, 10));

          // Atualiza a tarefa
          const [updated] = await db.update(tasks)
            .set({
              title: updateData.title,
              description: updateData.description ?? null,
              completed: updateData.completed ?? false,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, originalId))
            .returning();

          // Verifica que ID e createdAt foram preservados
          expect(updated.id).toBe(originalId);
          expect(updated.createdAt.getTime()).toBe(originalCreatedAt.getTime());

          // Verifica que os campos foram atualizados
          expect(updated.title).toBe(updateData.title);
          expect(updated.description).toBe(updateData.description ?? null);
          expect(updated.completed).toBe(updateData.completed ?? false);

          // Verifica que updatedAt foi atualizado
          expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalCreatedAt.getTime());

          // Limpa a tarefa criada
          await db.delete(tasks).where(eq(tasks.id, originalId));
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 4: Task Deletion Removes Task
   * 
   * **Validates: Requirements 1.5**
   * 
   * Para qualquer tarefa existente, deletá-la deve resultar em
   * tentativas subsequentes de recuperá-la retornando vazio/não encontrado.
   */
  it('Property 4: Task Deletion Removes Task - deletar deve remover tarefa completamente', async () => {
    await fc.assert(
      fc.asyncProperty(validTaskData(), async (taskData) => {
        // Cria a tarefa
        const [created] = await db.insert(tasks).values({
          title: taskData.title,
          description: taskData.description ?? null,
          completed: taskData.completed ?? false,
        }).returning();

        const taskId = created.id;

        // Verifica que a tarefa existe
        const [beforeDelete] = await db.select().from(tasks).where(eq(tasks.id, taskId));
        expect(beforeDelete).toBeDefined();

        // Deleta a tarefa
        await db.delete(tasks).where(eq(tasks.id, taskId));

        // Tenta recuperar a tarefa deletada
        const [afterDelete] = await db.select().from(tasks).where(eq(tasks.id, taskId));

        // Verifica que a tarefa não existe mais
        expect(afterDelete).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  }, 60000);
});
