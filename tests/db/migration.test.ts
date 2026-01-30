import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getConnection, closeConnection } from '../../src/db/connection';
import { tasks } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Testes de verificação da migration inicial
 * 
 * Estes testes verificam que:
 * 1. A tabela tasks foi criada corretamente
 * 2. É possível inserir dados na tabela
 * 3. Os campos e constraints estão funcionando
 * 4. Os valores padrão estão sendo aplicados
 * 
 * Requisitos testados: 2.1, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
describe('Migration Inicial - Tabela Tasks', () => {
  let db: ReturnType<typeof getConnection>;

  beforeAll(() => {
    // Estabelece conexão com o banco antes dos testes
    db = getConnection();
  });

  afterAll(async () => {
    // Limpa dados de teste e fecha conexão
    await db.delete(tasks);
    await closeConnection();
  });

  it('deve inserir uma tarefa com todos os campos', async () => {
    // Insere uma tarefa completa
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa de Teste Completa',
      description: 'Esta é uma descrição de teste',
      completed: false
    }).returning();

    // Verifica que a tarefa foi inserida com sucesso
    expect(insertedTask).toBeDefined();
    expect(insertedTask.id).toBeGreaterThan(0);
    expect(insertedTask.title).toBe('Tarefa de Teste Completa');
    expect(insertedTask.description).toBe('Esta é uma descrição de teste');
    expect(insertedTask.completed).toBe(false);
    expect(insertedTask.createdAt).toBeInstanceOf(Date);
    expect(insertedTask.updatedAt).toBeInstanceOf(Date);
  });

  it('deve inserir uma tarefa apenas com título (campos opcionais)', async () => {
    // Insere uma tarefa apenas com o campo obrigatório
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa Mínima'
    }).returning();

    // Verifica valores padrão
    expect(insertedTask).toBeDefined();
    expect(insertedTask.id).toBeGreaterThan(0);
    expect(insertedTask.title).toBe('Tarefa Mínima');
    expect(insertedTask.description).toBeNull();
    expect(insertedTask.completed).toBe(false); // Valor padrão
    expect(insertedTask.createdAt).toBeInstanceOf(Date);
    expect(insertedTask.updatedAt).toBeInstanceOf(Date);
  });

  it('deve gerar IDs únicos e auto-incrementados', async () => {
    // Insere duas tarefas
    const [task1] = await db.insert(tasks).values({
      title: 'Tarefa 1'
    }).returning();

    const [task2] = await db.insert(tasks).values({
      title: 'Tarefa 2'
    }).returning();

    // Verifica que os IDs são únicos e incrementados
    expect(task1.id).toBeDefined();
    expect(task2.id).toBeDefined();
    expect(task2.id).toBeGreaterThan(task1.id);
  });

  it('deve aplicar valor padrão false para completed', async () => {
    // Insere tarefa sem especificar completed
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa com Completed Padrão'
    }).returning();

    // Verifica que completed é false por padrão
    expect(insertedTask.completed).toBe(false);
  });

  it('deve permitir completed como true', async () => {
    // Insere tarefa com completed = true
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa Completada',
      completed: true
    }).returning();

    // Verifica que completed foi definido como true
    expect(insertedTask.completed).toBe(true);
  });

  it('deve definir timestamps automaticamente', async () => {
    const beforeInsert = new Date();
    
    // Insere tarefa
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa com Timestamps'
    }).returning();

    const afterInsert = new Date();

    // Verifica que os timestamps foram definidos automaticamente
    expect(insertedTask.createdAt).toBeInstanceOf(Date);
    expect(insertedTask.updatedAt).toBeInstanceOf(Date);
    
    // Verifica que os timestamps estão no intervalo esperado
    expect(insertedTask.createdAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime() - 1000);
    expect(insertedTask.createdAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime() + 1000);
    expect(insertedTask.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime() - 1000);
    expect(insertedTask.updatedAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime() + 1000);
  });

  it('deve permitir description como null', async () => {
    // Insere tarefa com description explicitamente null
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa sem Descrição',
      description: null
    }).returning();

    // Verifica que description é null
    expect(insertedTask.description).toBeNull();
  });

  it('deve buscar tarefa por ID', async () => {
    // Insere uma tarefa
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa para Buscar'
    }).returning();

    // Busca a tarefa pelo ID
    const [foundTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, insertedTask.id));

    // Verifica que a tarefa foi encontrada
    expect(foundTask).toBeDefined();
    expect(foundTask.id).toBe(insertedTask.id);
    expect(foundTask.title).toBe('Tarefa para Buscar');
  });

  it('deve listar todas as tarefas', async () => {
    // Limpa a tabela
    await db.delete(tasks);

    // Insere 3 tarefas
    await db.insert(tasks).values([
      { title: 'Tarefa A' },
      { title: 'Tarefa B' },
      { title: 'Tarefa C' }
    ]);

    // Lista todas as tarefas
    const allTasks = await db.select().from(tasks);

    // Verifica que todas as tarefas foram retornadas
    expect(allTasks).toHaveLength(3);
    expect(allTasks.map(t => t.title)).toContain('Tarefa A');
    expect(allTasks.map(t => t.title)).toContain('Tarefa B');
    expect(allTasks.map(t => t.title)).toContain('Tarefa C');
  });

  it('deve atualizar uma tarefa', async () => {
    // Insere uma tarefa
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa Original',
      completed: false
    }).returning();

    // Aguarda um momento para garantir que updatedAt será diferente
    await new Promise(resolve => setTimeout(resolve, 10));

    // Atualiza a tarefa
    const [updatedTask] = await db
      .update(tasks)
      .set({
        title: 'Tarefa Atualizada',
        completed: true
      })
      .where(eq(tasks.id, insertedTask.id))
      .returning();

    // Verifica que a tarefa foi atualizada
    expect(updatedTask.id).toBe(insertedTask.id);
    expect(updatedTask.title).toBe('Tarefa Atualizada');
    expect(updatedTask.completed).toBe(true);
    expect(updatedTask.createdAt.getTime()).toBe(insertedTask.createdAt.getTime());
    // Note: updatedAt não é atualizado automaticamente pelo Drizzle, 
    // isso precisa ser implementado na aplicação
  });

  it('deve deletar uma tarefa', async () => {
    // Insere uma tarefa
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Tarefa para Deletar'
    }).returning();

    // Deleta a tarefa
    await db.delete(tasks).where(eq(tasks.id, insertedTask.id));

    // Tenta buscar a tarefa deletada
    const [foundTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, insertedTask.id));

    // Verifica que a tarefa não existe mais
    expect(foundTask).toBeUndefined();
  });
});
