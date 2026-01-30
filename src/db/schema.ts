import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Schema da tabela de tarefas (tasks)
 * 
 * Define a estrutura de dados para armazenar tarefas no PostgreSQL.
 * Cada tarefa possui um identificador único, título, descrição opcional,
 * status de conclusão e timestamps de criação e atualização.
 * 
 * Requisitos atendidos:
 * - 8.1: Campo id único e auto-incremento
 * - 8.2: Campo title obrigatório (NOT NULL)
 * - 8.3: Campo description opcional
 * - 8.4: Campo completed com valor padrão false
 * - 8.5: Campos de timestamp (createdAt e updatedAt)
 * - 8.6: Constraints aplicados pelo banco de dados
 */
export const tasks = pgTable('tasks', {
  // 8.1: Identificador único auto-incremento
  id: serial('id').primaryKey(),
  
  // 8.2: Título obrigatório, máximo 255 caracteres
  title: varchar('title', { length: 255 }).notNull(),
  
  // 8.3: Descrição opcional, texto sem limite de tamanho
  description: text('description'),
  
  // 8.4: Status de conclusão, padrão false, obrigatório
  completed: boolean('completed').default(false).notNull(),
  
  // 8.5: Timestamp de criação, definido automaticamente
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // 8.5: Timestamp de última atualização, definido automaticamente
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Tipos TypeScript inferidos do schema Drizzle
 * 
 * Task: Tipo completo de uma tarefa (incluindo campos gerados como id)
 * CreateTaskInput: Tipo para criação de tarefa (campos opcionais e gerados são omitidos)
 * UpdateTaskInput: Tipo para atualização de tarefa (todos os campos são opcionais, exceto id e createdAt)
 */
export type Task = typeof tasks.$inferSelect;
export type CreateTaskInput = typeof tasks.$inferInsert;
export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'id' | 'createdAt'>>;
