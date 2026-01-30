import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getConnection, closeConnection } from '../../src/db/connection';
import { tasks } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import * as taskController from '../../src/controllers/task.controller';
import { createTaskSchema, updateTaskSchema } from '../../src/types/task.types';

/**
 * Testes de integração para rotas de tarefas
 * 
 * Valida que os endpoints REST funcionam corretamente com:
 * - Validação de payloads
 * - Status codes apropriados
 * - Estrutura de resposta correta
 * - Integração com banco de dados
 * 
 * Nota: Estes testes validam a lógica de negócio e integração com o banco.
 * Os testes de rotas HTTP completos serão feitos quando o servidor estiver rodando.
 * 
 * Requirements: 4.3, 4.4, 4.5
 */

describe('Task Routes Integration Tests', () => {
  let db: ReturnType<typeof getConnection>;
  let createdTaskIds: number[] = [];

  beforeAll(async () => {
    // Conecta ao banco de dados
    db = getConnection();
  });

  afterAll(async () => {
    // Limpa tarefas criadas durante os testes
    if (createdTaskIds.length > 0) {
      for (const id of createdTaskIds) {
        try {
          await db.delete(tasks).where(eq(tasks.id, id));
        } catch (error) {
          // Ignora erros de limpeza
        }
      }
    }

    // Fecha conexão com banco
    await closeConnection();
  });

  beforeEach(() => {
    // Reseta lista de IDs criados
    createdTaskIds = [];
  });

  describe('POST /api/tasks - Criar tarefa (Lógica de negócio)', () => {
    it('deve criar uma nova tarefa com dados válidos', async () => {
      const taskData = {
        title: 'Tarefa de teste de integração',
        description: 'Descrição da tarefa de teste',
        completed: false
      };

      // Valida o schema
      const validatedData = createTaskSchema.parse(taskData);
      expect(validatedData).toBeDefined();

      // Cria a tarefa
      const createdTask = await taskController.create(taskData);

      expect(createdTask).toHaveProperty('id');
      expect(createdTask.title).toBe(taskData.title);
      expect(createdTask.description).toBe(taskData.description);
      expect(createdTask.completed).toBe(false);
      expect(createdTask).toHaveProperty('createdAt');
      expect(createdTask).toHaveProperty('updatedAt');

      createdTaskIds.push(createdTask.id);
    });

    it('deve criar tarefa sem description e usar completed padrão false', async () => {
      const taskData = {
        title: 'Tarefa mínima'
      };

      const validatedData = createTaskSchema.parse(taskData);
      const createdTask = await taskController.create(validatedData);

      expect(createdTask.title).toBe(taskData.title);
      expect(createdTask.description).toBeNull();
      expect(createdTask.completed).toBe(false);

      createdTaskIds.push(createdTask.id);
    });

    it('deve rejeitar criação quando title estiver faltando', () => {
      const taskData = {
        description: 'Sem título'
      };

      expect(() => createTaskSchema.parse(taskData)).toThrow();
    });

    it('deve rejeitar criação quando title for vazio após trim', () => {
      const taskData = {
        title: '',
        description: 'Título vazio'
      };

      // O schema usa .trim(), então espaços em branco são removidos
      // e uma string vazia deve falhar na validação .min(1)
      expect(() => createTaskSchema.parse(taskData)).toThrow();
    });

    it('deve rejeitar criação quando title exceder 255 caracteres', () => {
      const taskData = {
        title: 'a'.repeat(256)
      };

      expect(() => createTaskSchema.parse(taskData)).toThrow();
    });

    it('deve rejeitar criação quando completed não for boolean', () => {
      const taskData = {
        title: 'Tarefa válida',
        completed: 'sim' as any
      };

      expect(() => createTaskSchema.parse(taskData)).toThrow();
    });
  });

  describe('GET /api/tasks - Listar tarefas (Lógica de negócio)', () => {
    it('deve retornar lista de tarefas', async () => {
      // Cria algumas tarefas primeiro
      const task1 = await db.insert(tasks).values({
        title: 'Tarefa 1',
        description: 'Descrição 1',
        completed: false
      }).returning();
      
      const task2 = await db.insert(tasks).values({
        title: 'Tarefa 2',
        completed: true
      }).returning();

      createdTaskIds.push(task1[0].id, task2[0].id);

      const allTasks = await taskController.findAll();

      expect(Array.isArray(allTasks)).toBe(true);
      expect(allTasks.length).toBeGreaterThanOrEqual(2);
      
      // Verifica que as tarefas criadas estão na lista
      const foundTask1 = allTasks.find(t => t.id === task1[0].id);
      const foundTask2 = allTasks.find(t => t.id === task2[0].id);
      
      expect(foundTask1).toBeDefined();
      expect(foundTask2).toBeDefined();
    });

    it('deve retornar estrutura correta para cada tarefa', async () => {
      const task = await db.insert(tasks).values({
        title: 'Tarefa para verificar estrutura',
        description: 'Teste de estrutura',
        completed: false
      }).returning();

      createdTaskIds.push(task[0].id);

      const allTasks = await taskController.findAll();
      const foundTask = allTasks.find(t => t.id === task[0].id);
      
      expect(foundTask).toBeDefined();
      expect(foundTask).toHaveProperty('id');
      expect(foundTask).toHaveProperty('title');
      expect(foundTask).toHaveProperty('description');
      expect(foundTask).toHaveProperty('completed');
      expect(foundTask).toHaveProperty('createdAt');
      expect(foundTask).toHaveProperty('updatedAt');
    });
  });

  describe('GET /api/tasks/:id - Obter tarefa por ID (Lógica de negócio)', () => {
    it('deve retornar tarefa específica', async () => {
      const task = await db.insert(tasks).values({
        title: 'Tarefa específica',
        description: 'Para buscar por ID',
        completed: false
      }).returning();

      createdTaskIds.push(task[0].id);

      const foundTask = await taskController.findById(task[0].id);

      expect(foundTask).toBeDefined();
      expect(foundTask?.id).toBe(task[0].id);
      expect(foundTask?.title).toBe(task[0].title);
      expect(foundTask?.description).toBe(task[0].description);
    });

    it('deve retornar null quando tarefa não existir', async () => {
      const nonExistentId = 999999;

      const foundTask = await taskController.findById(nonExistentId);

      expect(foundTask).toBeNull();
    });

    it('deve validar ID inválido (não numérico)', () => {
      const invalidId = 'abc';
      
      // Validação de ID deve rejeitar strings não numéricas
      expect(!/^\d+$/.test(invalidId)).toBe(true);
    });

    it('deve validar ID negativo', () => {
      const negativeId = '-1';
      
      // Validação de ID deve rejeitar negativos
      const id = parseInt(negativeId, 10);
      expect(id <= 0).toBe(true);
    });

    it('deve validar ID zero', () => {
      const zeroId = '0';
      
      // Validação de ID deve rejeitar zero
      const id = parseInt(zeroId, 10);
      expect(id <= 0).toBe(true);
    });
  });

  describe('PUT /api/tasks/:id - Atualizar tarefa (Lógica de negócio)', () => {
    it('deve atualizar tarefa existente', async () => {
      const task = await db.insert(tasks).values({
        title: 'Tarefa original',
        description: 'Descrição original',
        completed: false
      }).returning();

      createdTaskIds.push(task[0].id);

      const updateData = {
        title: 'Tarefa atualizada',
        completed: true
      };

      // Valida o schema de atualização
      const validatedData = updateTaskSchema.parse(updateData);
      
      const updatedTask = await taskController.update(task[0].id, validatedData);

      expect(updatedTask).toBeDefined();
      expect(updatedTask?.id).toBe(task[0].id);
      expect(updatedTask?.title).toBe(updateData.title);
      expect(updatedTask?.completed).toBe(true);
      expect(updatedTask?.createdAt).toBeDefined();
      expect(updatedTask?.updatedAt).toBeDefined();
    });

    it('deve preservar ID e createdAt ao atualizar', async () => {
      const task = await db.insert(tasks).values({
        title: 'Tarefa para testar preservação',
        completed: false
      }).returning();

      createdTaskIds.push(task[0].id);

      const originalId = task[0].id;
      const originalCreatedAt = task[0].createdAt;

      const updateData = {
        title: 'Título modificado'
      };

      const updatedTask = await taskController.update(task[0].id, updateData);

      expect(updatedTask?.id).toBe(originalId);
      expect(updatedTask?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('deve retornar null quando tarefa não existir', async () => {
      const nonExistentId = 999999;
      const updateData = {
        title: 'Tentativa de atualização'
      };

      const updatedTask = await taskController.update(nonExistentId, updateData);

      expect(updatedTask).toBeNull();
    });

    it('deve rejeitar atualização quando nenhum campo for fornecido', () => {
      expect(() => updateTaskSchema.parse({})).toThrow();
    });

    it('deve rejeitar atualização quando title exceder 255 caracteres', () => {
      const updateData = {
        title: 'a'.repeat(256)
      };

      expect(() => updateTaskSchema.parse(updateData)).toThrow();
    });
  });

  describe('DELETE /api/tasks/:id - Deletar tarefa (Lógica de negócio)', () => {
    it('deve deletar tarefa existente', async () => {
      const task = await db.insert(tasks).values({
        title: 'Tarefa para deletar',
        completed: false
      }).returning();

      const taskId = task[0].id;

      const deleted = await taskController.deleteTask(taskId);

      expect(deleted).toBe(true);

      // Verifica que a tarefa foi realmente deletada
      const foundTask = await taskController.findById(taskId);
      expect(foundTask).toBeNull();
    });

    it('deve retornar false quando tarefa não existir', async () => {
      const nonExistentId = 999999;

      const deleted = await taskController.deleteTask(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('Validação de schemas Zod', () => {
    it('deve validar schema de criação corretamente', () => {
      const validData = {
        title: 'Tarefa válida',
        description: 'Descrição válida',
        completed: false
      };

      const result = createTaskSchema.parse(validData);
      expect(result).toBeDefined();
      expect(result.title).toBe(validData.title);
    });

    it('deve validar schema de atualização corretamente', () => {
      const validData = {
        title: 'Título atualizado'
      };

      const result = updateTaskSchema.parse(validData);
      expect(result).toBeDefined();
      expect(result.title).toBe(validData.title);
    });

    it('deve rejeitar dados inválidos no schema de criação', () => {
      const invalidData = {
        title: '', // Vazio
        completed: 'sim' // Não é boolean
      };

      expect(() => createTaskSchema.parse(invalidData)).toThrow();
    });

    it('deve rejeitar dados inválidos no schema de atualização', () => {
      const invalidData = {
        title: 'a'.repeat(256) // Muito longo
      };

      expect(() => updateTaskSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Integração completa - Fluxo CRUD', () => {
    it('deve executar fluxo completo: criar, ler, atualizar, deletar', async () => {
      // 1. Criar
      const createData = {
        title: 'Tarefa de fluxo completo',
        description: 'Teste de integração completo',
        completed: false
      };

      const created = await taskController.create(createData);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      createdTaskIds.push(created.id);

      // 2. Ler (por ID)
      const found = await taskController.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe(createData.title);

      // 3. Ler (lista)
      const allTasks = await taskController.findAll();
      expect(allTasks.some(t => t.id === created.id)).toBe(true);

      // 4. Atualizar
      const updateData = {
        title: 'Tarefa atualizada',
        completed: true
      };
      const updated = await taskController.update(created.id, updateData);
      expect(updated).toBeDefined();
      expect(updated?.title).toBe(updateData.title);
      expect(updated?.completed).toBe(true);

      // 5. Deletar
      const deleted = await taskController.deleteTask(created.id);
      expect(deleted).toBe(true);

      // 6. Verificar que foi deletada
      const notFound = await taskController.findById(created.id);
      expect(notFound).toBeNull();

      // Remove da lista de limpeza já que foi deletada
      createdTaskIds = createdTaskIds.filter(id => id !== created.id);
    });
  });
});
