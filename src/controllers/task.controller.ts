import { eq } from 'drizzle-orm';
import { getConnection } from '../db/connection';
import { tasks, Task, CreateTaskInput, UpdateTaskInput } from '../db/schema';
import { CreateTaskRequest, UpdateTaskRequest } from '../types/task.types';

/**
 * Task Controller
 * 
 * Implementa a lógica de negócio para operações CRUD de tarefas.
 * Este controller interage diretamente com o banco de dados via Drizzle ORM.
 * 
 * Requisitos atendidos:
 * - 1.1: Criar nova tarefa
 * - 1.2: Listar todas as tarefas
 * - 1.3: Buscar tarefa por ID
 * - 1.4: Atualizar tarefa existente
 * - 1.5: Deletar tarefa
 * - 2.3: Usar Drizzle ORM para todas as queries
 */

/**
 * Lista todas as tarefas do banco de dados
 * 
 * @returns Promise com array de todas as tarefas
 * @throws Error se houver falha na consulta ao banco
 * 
 * Requisito 1.2: Retornar todas as tarefas existentes
 */
export async function findAll(): Promise<Task[]> {
  try {
    const db = getConnection();
    const allTasks = await db.select().from(tasks);
    return allTasks;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao buscar tarefas: ${errorMessage}`);
  }
}

/**
 * Busca uma tarefa específica por ID
 * 
 * @param id - ID da tarefa a ser buscada
 * @returns Promise com a tarefa encontrada ou null se não existir
 * @throws Error se houver falha na consulta ao banco
 * 
 * Requisito 1.3: Retornar tarefa específica por ID
 */
export async function findById(id: number): Promise<Task | null> {
  try {
    const db = getConnection();
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0]! : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao buscar tarefa por ID: ${errorMessage}`);
  }
}

/**
 * Cria uma nova tarefa no banco de dados
 * 
 * @param data - Dados da tarefa a ser criada (title, description, completed)
 * @returns Promise com a tarefa criada incluindo ID e timestamps
 * @throws Error se houver falha na inserção no banco
 * 
 * Requisito 1.1: Criar nova tarefa e retornar com ID único
 */
export async function create(data: CreateTaskRequest): Promise<Task> {
  try {
    const db = getConnection();
    
    // Prepara os dados para inserção
    const insertData: CreateTaskInput = {
      title: data.title,
      description: data.description || null,
      completed: data.completed ?? false
    };
    
    // Insere a tarefa e retorna o registro criado
    const result = await db
      .insert(tasks)
      .values(insertData)
      .returning();
    
    if (result.length === 0) {
      throw new Error('Falha ao criar tarefa: nenhum registro retornado');
    }
    
    return result[0]!;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao criar tarefa: ${errorMessage}`);
  }
}

/**
 * Atualiza uma tarefa existente no banco de dados
 * 
 * @param id - ID da tarefa a ser atualizada
 * @param data - Dados a serem atualizados (title, description, completed)
 * @returns Promise com a tarefa atualizada ou null se não existir
 * @throws Error se houver falha na atualização no banco
 * 
 * Requisito 1.4: Atualizar tarefa existente e retornar versão atualizada
 */
export async function update(id: number, data: UpdateTaskRequest): Promise<Task | null> {
  try {
    const db = getConnection();
    
    // Verifica se a tarefa existe antes de atualizar
    const existingTask = await findById(id);
    if (!existingTask) {
      return null;
    }
    
    // Prepara os dados para atualização
    const updateData: UpdateTaskInput = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.completed !== undefined && { completed: data.completed }),
      updatedAt: new Date() // Atualiza o timestamp
    };
    
    // Atualiza a tarefa e retorna o registro atualizado
    const result = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0]!;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao atualizar tarefa: ${errorMessage}`);
  }
}

/**
 * Remove uma tarefa do banco de dados
 * 
 * @param id - ID da tarefa a ser removida
 * @returns Promise com true se a tarefa foi deletada, false se não existia
 * @throws Error se houver falha na deleção no banco
 * 
 * Requisito 1.5: Remover tarefa do banco de dados
 */
export async function deleteTask(id: number): Promise<boolean> {
  try {
    const db = getConnection();
    
    // Verifica se a tarefa existe antes de deletar
    const existingTask = await findById(id);
    if (!existingTask) {
      return false;
    }
    
    // Deleta a tarefa
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    
    return result.length > 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao deletar tarefa: ${errorMessage}`);
  }
}
