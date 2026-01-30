import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as taskController from '../../../src/controllers/task.controller';
import { getConnection, closeConnection } from '../../../src/db/connection';
import { tasks } from '../../../src/db/schema';
import { CreateTaskRequest, UpdateTaskRequest } from '../../../src/types/task.types';

/**
 * Testes unitários para Task Controller
 * 
 * Valida todas as operações CRUD do controller:
 * - findAll(): buscar todas as tarefas
 * - findById(id): buscar tarefa por ID
 * - create(data): criar nova tarefa
 * - update(id, data): atualizar tarefa existente
 * - deleteTask(id): deletar tarefa
 * 
 * Requisitos testados: 1.1, 1.2, 1.3, 1.4, 1.5
 */

describe('Task Controller', () => {
  // Limpa a tabela de tarefas antes de cada teste
  beforeEach(async () => {
    const db = getConnection();
    await db.delete(tasks);
  });

  // Fecha a conexão após todos os testes
  afterAll(async () => {
    await closeConnection();
  });

  describe('findAll()', () => {
    it('deve retornar array vazio quando não há tarefas', async () => {
      // Requisito 1.2: Retornar todas as tarefas existentes
      const result = await taskController.findAll();
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve retornar todas as tarefas existentes', async () => {
      // Requisito 1.2: Retornar todas as tarefas existentes
      // Cria algumas tarefas de teste
      const task1: CreateTaskRequest = {
        title: 'Tarefa 1',
        description: 'Descrição 1',
        completed: false
      };
      const task2: CreateTaskRequest = {
        title: 'Tarefa 2',
        completed: true
      };
      
      await taskController.create(task1);
      await taskController.create(task2);
      
      const result = await taskController.findAll();
      
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Tarefa 1');
      expect(result[1].title).toBe('Tarefa 2');
    });

    it('deve retornar tarefas com todos os campos corretos', async () => {
      // Requisito 1.2: Retornar todas as tarefas com estrutura completa
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Completa',
        description: 'Descrição detalhada',
        completed: false
      };
      
      await taskController.create(taskData);
      const result = await taskController.findAll();
      
      expect(result).toHaveLength(1);
      const task = result[0];
      
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Tarefa Completa');
      expect(task.description).toBe('Descrição detalhada');
      expect(task.completed).toBe(false);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById()', () => {
    it('deve retornar null quando a tarefa não existe', async () => {
      // Requisito 1.3: Retornar null para ID inexistente
      const result = await taskController.findById(999);
      
      expect(result).toBeNull();
    });

    it('deve retornar a tarefa correta quando existe', async () => {
      // Requisito 1.3: Retornar tarefa específica por ID
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Específica',
        description: 'Descrição específica',
        completed: false
      };
      
      const created = await taskController.create(taskData);
      const result = await taskController.findById(created.id);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.title).toBe('Tarefa Específica');
      expect(result?.description).toBe('Descrição específica');
      expect(result?.completed).toBe(false);
    });

    it('deve retornar tarefa com description null quando não fornecida', async () => {
      // Requisito 1.3: Retornar tarefa com campos opcionais null
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Sem Descrição',
        completed: true
      };
      
      const created = await taskController.create(taskData);
      const result = await taskController.findById(created.id);
      
      expect(result).not.toBeNull();
      expect(result?.description).toBeNull();
      expect(result?.completed).toBe(true);
    });

    it('deve retornar null para ID negativo', async () => {
      // Caso de borda: ID inválido (negativo)
      const result = await taskController.findById(-1);
      
      expect(result).toBeNull();
    });

    it('deve retornar null para ID zero', async () => {
      // Caso de borda: ID inválido (zero)
      const result = await taskController.findById(0);
      
      expect(result).toBeNull();
    });
  });

  describe('create()', () => {
    it('deve criar uma nova tarefa com todos os campos', async () => {
      // Requisito 1.1: Criar nova tarefa e retornar com ID único
      const taskData: CreateTaskRequest = {
        title: 'Nova Tarefa',
        description: 'Descrição da nova tarefa',
        completed: false
      };
      
      const result = await taskController.create(taskData);
      
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.title).toBe('Nova Tarefa');
      expect(result.description).toBe('Descrição da nova tarefa');
      expect(result.completed).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('deve criar tarefa sem description (opcional)', async () => {
      // Requisito 1.1: Criar tarefa com campos opcionais omitidos
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Sem Descrição',
        completed: true
      };
      
      const result = await taskController.create(taskData);
      
      expect(result.id).toBeDefined();
      expect(result.title).toBe('Tarefa Sem Descrição');
      expect(result.description).toBeNull();
      expect(result.completed).toBe(true);
    });

    it('deve usar completed=false como padrão quando não fornecido', async () => {
      // Requisito 1.1: Usar valor padrão para completed
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Com Padrão'
      };
      
      const result = await taskController.create(taskData);
      
      expect(result.completed).toBe(false);
    });

    it('deve criar múltiplas tarefas com IDs únicos', async () => {
      // Requisito 1.1: Garantir IDs únicos para cada tarefa
      const task1: CreateTaskRequest = { title: 'Tarefa 1' };
      const task2: CreateTaskRequest = { title: 'Tarefa 2' };
      const task3: CreateTaskRequest = { title: 'Tarefa 3' };
      
      const result1 = await taskController.create(task1);
      const result2 = await taskController.create(task2);
      const result3 = await taskController.create(task3);
      
      expect(result1.id).not.toBe(result2.id);
      expect(result2.id).not.toBe(result3.id);
      expect(result1.id).not.toBe(result3.id);
    });

    it('deve definir timestamps automaticamente', async () => {
      // Requisito 1.1: Definir createdAt e updatedAt automaticamente
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Com Timestamps'
      };
      
      const before = new Date();
      const result = await taskController.create(taskData);
      const after = new Date();
      
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('deve criar tarefa com title vazio (validação é responsabilidade do middleware)', async () => {
      // Caso de borda: title vazio (validação deve ser feita no middleware)
      const taskData: CreateTaskRequest = {
        title: ''
      };
      
      const result = await taskController.create(taskData);
      
      expect(result.title).toBe('');
    });
  });

  describe('update()', () => {
    it('deve atualizar todos os campos de uma tarefa', async () => {
      // Requisito 1.4: Atualizar tarefa existente
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Original',
        description: 'Descrição original',
        completed: false
      };
      
      const created = await taskController.create(taskData);
      
      const updateData: UpdateTaskRequest = {
        title: 'Tarefa Atualizada',
        description: 'Descrição atualizada',
        completed: true
      };
      
      const result = await taskController.update(created.id, updateData);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.title).toBe('Tarefa Atualizada');
      expect(result?.description).toBe('Descrição atualizada');
      expect(result?.completed).toBe(true);
    });

    it('deve atualizar apenas o campo title', async () => {
      // Requisito 1.4: Atualização parcial de tarefa
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Original',
        description: 'Descrição original',
        completed: false
      };
      
      const created = await taskController.create(taskData);
      
      const updateData: UpdateTaskRequest = {
        title: 'Apenas Título Atualizado'
      };
      
      const result = await taskController.update(created.id, updateData);
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Apenas Título Atualizado');
      expect(result?.description).toBe('Descrição original');
      expect(result?.completed).toBe(false);
    });

    it('deve atualizar apenas o campo completed', async () => {
      // Requisito 1.4: Atualização parcial de tarefa
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Original',
        completed: false
      };
      
      const created = await taskController.create(taskData);
      
      const updateData: UpdateTaskRequest = {
        completed: true
      };
      
      const result = await taskController.update(created.id, updateData);
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Tarefa Original');
      expect(result?.completed).toBe(true);
    });

    it('deve preservar o ID e createdAt ao atualizar', async () => {
      // Requisito 1.4: Preservar ID e createdAt na atualização
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Original'
      };
      
      const created = await taskController.create(taskData);
      const originalCreatedAt = created.createdAt;
      
      // Aguarda um pouco para garantir que updatedAt será diferente
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updateData: UpdateTaskRequest = {
        title: 'Tarefa Atualizada'
      };
      
      const result = await taskController.update(created.id, updateData);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('deve atualizar o timestamp updatedAt', async () => {
      // Requisito 1.4: Atualizar updatedAt na atualização
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Original'
      };
      
      const created = await taskController.create(taskData);
      const originalUpdatedAt = created.updatedAt;
      
      // Aguarda um pouco para garantir que updatedAt será diferente
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updateData: UpdateTaskRequest = {
        title: 'Tarefa Atualizada'
      };
      
      const result = await taskController.update(created.id, updateData);
      
      expect(result).not.toBeNull();
      expect(result?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('deve retornar null quando a tarefa não existe', async () => {
      // Caso de borda: atualizar tarefa inexistente
      const updateData: UpdateTaskRequest = {
        title: 'Tarefa Inexistente'
      };
      
      const result = await taskController.update(999, updateData);
      
      expect(result).toBeNull();
    });

    it('deve retornar null para ID negativo', async () => {
      // Caso de borda: ID inválido (negativo)
      const updateData: UpdateTaskRequest = {
        title: 'Tarefa Inválida'
      };
      
      const result = await taskController.update(-1, updateData);
      
      expect(result).toBeNull();
    });

    it('deve retornar null para ID zero', async () => {
      // Caso de borda: ID inválido (zero)
      const updateData: UpdateTaskRequest = {
        title: 'Tarefa Inválida'
      };
      
      const result = await taskController.update(0, updateData);
      
      expect(result).toBeNull();
    });
  });

  describe('deleteTask()', () => {
    it('deve deletar uma tarefa existente', async () => {
      // Requisito 1.5: Remover tarefa do banco de dados
      const taskData: CreateTaskRequest = {
        title: 'Tarefa Para Deletar'
      };
      
      const created = await taskController.create(taskData);
      const result = await taskController.deleteTask(created.id);
      
      expect(result).toBe(true);
      
      // Verifica que a tarefa foi realmente deletada
      const found = await taskController.findById(created.id);
      expect(found).toBeNull();
    });

    it('deve retornar false quando a tarefa não existe', async () => {
      // Caso de borda: deletar tarefa inexistente
      const result = await taskController.deleteTask(999);
      
      expect(result).toBe(false);
    });

    it('deve retornar false para ID negativo', async () => {
      // Caso de borda: ID inválido (negativo)
      const result = await taskController.deleteTask(-1);
      
      expect(result).toBe(false);
    });

    it('deve retornar false para ID zero', async () => {
      // Caso de borda: ID inválido (zero)
      const result = await taskController.deleteTask(0);
      
      expect(result).toBe(false);
    });

    it('deve remover apenas a tarefa especificada', async () => {
      // Requisito 1.5: Deletar apenas a tarefa especificada
      const task1: CreateTaskRequest = { title: 'Tarefa 1' };
      const task2: CreateTaskRequest = { title: 'Tarefa 2' };
      const task3: CreateTaskRequest = { title: 'Tarefa 3' };
      
      const created1 = await taskController.create(task1);
      const created2 = await taskController.create(task2);
      const created3 = await taskController.create(task3);
      
      // Deleta apenas a tarefa 2
      const result = await taskController.deleteTask(created2.id);
      expect(result).toBe(true);
      
      // Verifica que as outras tarefas ainda existem
      const found1 = await taskController.findById(created1.id);
      const found2 = await taskController.findById(created2.id);
      const found3 = await taskController.findById(created3.id);
      
      expect(found1).not.toBeNull();
      expect(found2).toBeNull();
      expect(found3).not.toBeNull();
    });

    it('deve permitir deletar todas as tarefas', async () => {
      // Requisito 1.5: Permitir deletar múltiplas tarefas
      const task1: CreateTaskRequest = { title: 'Tarefa 1' };
      const task2: CreateTaskRequest = { title: 'Tarefa 2' };
      
      const created1 = await taskController.create(task1);
      const created2 = await taskController.create(task2);
      
      await taskController.deleteTask(created1.id);
      await taskController.deleteTask(created2.id);
      
      const allTasks = await taskController.findAll();
      expect(allTasks).toHaveLength(0);
    });
  });

  describe('Integração entre operações', () => {
    it('deve executar ciclo completo CRUD', async () => {
      // Testa o fluxo completo: Create -> Read -> Update -> Delete
      
      // 1. Create
      const createData: CreateTaskRequest = {
        title: 'Tarefa CRUD',
        description: 'Teste completo',
        completed: false
      };
      const created = await taskController.create(createData);
      expect(created.id).toBeDefined();
      
      // 2. Read (findById)
      const found = await taskController.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Tarefa CRUD');
      
      // 3. Read (findAll)
      const allTasks = await taskController.findAll();
      expect(allTasks).toHaveLength(1);
      
      // 4. Update
      const updateData: UpdateTaskRequest = {
        title: 'Tarefa CRUD Atualizada',
        completed: true
      };
      const updated = await taskController.update(created.id, updateData);
      expect(updated?.title).toBe('Tarefa CRUD Atualizada');
      expect(updated?.completed).toBe(true);
      
      // 5. Delete
      const deleted = await taskController.deleteTask(created.id);
      expect(deleted).toBe(true);
      
      // 6. Verify deletion
      const notFound = await taskController.findById(created.id);
      expect(notFound).toBeNull();
    });
  });
});
