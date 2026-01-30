import { describe, it, expect } from 'vitest';
import { tasks, type Task, type CreateTaskInput, type UpdateTaskInput } from '../../src/db/schema';

/**
 * Testes unitários para o schema de tasks
 * 
 * Valida que o schema Drizzle está definido corretamente e que
 * os tipos TypeScript são inferidos adequadamente.
 */
describe('Schema de Tasks', () => {
  it('deve ter a estrutura de tabela correta', () => {
    // Verifica que a tabela tasks existe e tem o nome correto
    expect(tasks).toBeDefined();
    expect((tasks as any)[Symbol.for('drizzle:Name')]).toBe('tasks');
  });

  it('deve ter todos os campos obrigatórios definidos', () => {
    const columns = (tasks as any)[Symbol.for('drizzle:Columns')];
    
    // Verifica que todos os campos existem
    expect(columns.id).toBeDefined();
    expect(columns.title).toBeDefined();
    expect(columns.description).toBeDefined();
    expect(columns.completed).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it('deve inferir tipos TypeScript corretamente', () => {
    // Teste de tipo: Task deve ter todos os campos
    const task: Task = {
      id: 1,
      title: 'Tarefa de teste',
      description: 'Descrição da tarefa',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    expect(task).toBeDefined();
  });

  it('deve permitir description null no tipo Task', () => {
    // Teste de tipo: description pode ser null
    const task: Task = {
      id: 1,
      title: 'Tarefa sem descrição',
      description: null,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    expect(task.description).toBeNull();
  });

  it('deve inferir CreateTaskInput corretamente', () => {
    // Teste de tipo: CreateTaskInput não requer id, createdAt, updatedAt
    const input: CreateTaskInput = {
      title: 'Nova tarefa',
      description: 'Descrição opcional',
      completed: false
    };
    
    expect(input).toBeDefined();
  });

  it('deve inferir UpdateTaskInput corretamente', () => {
    // Teste de tipo: UpdateTaskInput permite campos opcionais
    const update: UpdateTaskInput = {
      title: 'Título atualizado'
    };
    
    expect(update).toBeDefined();
    
    // Também pode atualizar apenas completed
    const update2: UpdateTaskInput = {
      completed: true
    };
    
    expect(update2).toBeDefined();
  });

  it('deve validar constraints do schema', () => {
    const columns = (tasks as any)[Symbol.for('drizzle:Columns')];
    
    // title deve ser NOT NULL
    expect(columns.title.notNull).toBe(true);
    
    // completed deve ter valor padrão false
    expect(columns.completed.hasDefault).toBe(true);
    expect(columns.completed.notNull).toBe(true);
    
    // createdAt e updatedAt devem ter defaultNow
    expect(columns.createdAt.hasDefault).toBe(true);
    expect(columns.updatedAt.hasDefault).toBe(true);
  });
});
