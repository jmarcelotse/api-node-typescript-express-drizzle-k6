import { z } from 'zod';

/**
 * Schema Zod para validação de criação de tarefa
 * 
 * Valida os dados de entrada para criação de uma nova tarefa:
 * - title: obrigatório, string não-vazia, máximo 255 caracteres
 * - description: opcional, string
 * - completed: opcional, boolean (padrão: false)
 * 
 * Requisitos atendidos:
 * - 4.6: Validação de payloads de requisição
 * - 7.1: Retorno de 400 com detalhes de erro para dados inválidos
 * - 8.2: Title obrigatório com limite de 255 caracteres
 */
export const createTaskSchema = z.object({
  title: z
    .string({ message: 'O campo title deve ser uma string' })
    .min(1, 'O campo title não pode estar vazio')
    .max(255, 'O campo title deve ter no máximo 255 caracteres')
    .trim(),
  
  description: z
    .string({ message: 'O campo description deve ser uma string' })
    .optional(),
  
  completed: z
    .boolean({ message: 'O campo completed deve ser um boolean' })
    .optional()
    .default(false)
});

/**
 * Schema Zod para validação de atualização de tarefa
 * 
 * Valida os dados de entrada para atualização de uma tarefa existente:
 * - title: opcional, mas se fornecido deve ser string não-vazia, máximo 255 caracteres
 * - description: opcional, string
 * - completed: opcional, boolean
 * 
 * Todos os campos são opcionais, mas pelo menos um deve ser fornecido.
 * 
 * Requisitos atendidos:
 * - 4.6: Validação de payloads de requisição
 * - 7.1: Retorno de 400 com detalhes de erro para dados inválidos
 * - 8.2: Title com limite de 255 caracteres quando fornecido
 */
export const updateTaskSchema = z.object({
  title: z
    .string({ message: 'O campo title deve ser uma string' })
    .min(1, 'O campo title não pode estar vazio')
    .max(255, 'O campo title deve ter no máximo 255 caracteres')
    .trim()
    .optional(),
  
  description: z
    .string({ message: 'O campo description deve ser uma string' })
    .optional(),
  
  completed: z
    .boolean({ message: 'O campo completed deve ser um boolean' })
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Pelo menos um campo deve ser fornecido para atualização'
  }
);

/**
 * Tipos TypeScript inferidos dos schemas Zod
 */
export type CreateTaskRequest = z.infer<typeof createTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskSchema>;
