import { Router, Request, Response } from 'express';
import * as taskController from '../controllers/task.controller';
import { validateCreateTask, validateUpdateTask, validateTaskId } from '../middleware/validation';
import { logger } from '../config/logger';

/**
 * Router para endpoints REST de tarefas
 * 
 * Define todos os endpoints da API para operações CRUD de tarefas:
 * - GET /api/tasks - Lista todas as tarefas
 * - GET /api/tasks/:id - Obtém uma tarefa específica
 * - POST /api/tasks - Cria uma nova tarefa
 * - PUT /api/tasks/:id - Atualiza uma tarefa existente
 * - DELETE /api/tasks/:id - Remove uma tarefa
 * 
 * Requisitos atendidos:
 * - 4.3: Seguir convenções RESTful para endpoints
 * - 4.4: Usar métodos HTTP apropriados (GET, POST, PUT, DELETE)
 * - 4.5: Usar status codes HTTP apropriados
 */

const router = Router();

/**
 * GET /api/tasks
 * 
 * Lista todas as tarefas do banco de dados
 * 
 * @returns 200 OK com array de tarefas e contagem total
 * @returns 500 Internal Server Error em caso de erro no servidor
 * 
 * Requisito 1.2: Retornar todas as tarefas existentes
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const allTasks = await taskController.findAll();
    
    res.status(200).json({
      tasks: allTasks,
      count: allTasks.length
    });
  } catch (error) {
    logger.error({ error, message: 'Erro ao listar tarefas' });
    
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Erro ao buscar tarefas'
    });
  }
});

/**
 * GET /api/tasks/:id
 * 
 * Obtém uma tarefa específica por ID
 * 
 * @param id - ID da tarefa (validado pelo middleware validateTaskId)
 * @returns 200 OK com a tarefa encontrada
 * @returns 400 Bad Request se o ID for inválido
 * @returns 404 Not Found se a tarefa não existir
 * @returns 500 Internal Server Error em caso de erro no servidor
 * 
 * Requisito 1.3: Retornar tarefa específica por ID
 * Requisito 1.6: Retornar erro apropriado para ID inválido
 */
router.get('/:id', validateTaskId, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const task = await taskController.findById(id);
    
    if (!task) {
      res.status(404).json({
        error: 'NotFoundError',
        message: `Tarefa com ID ${id} não encontrada`
      });
      return;
    }
    
    res.status(200).json(task);
  } catch (error) {
    logger.error({ error, message: 'Erro ao buscar tarefa por ID' });
    
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Erro ao buscar tarefa'
    });
  }
});

/**
 * POST /api/tasks
 * 
 * Cria uma nova tarefa
 * 
 * @body title - Título da tarefa (obrigatório, 1-255 caracteres)
 * @body description - Descrição da tarefa (opcional)
 * @body completed - Status de conclusão (opcional, padrão: false)
 * @returns 201 Created com a tarefa criada incluindo ID e timestamps
 * @returns 400 Bad Request se os dados forem inválidos
 * @returns 500 Internal Server Error em caso de erro no servidor
 * 
 * Requisito 1.1: Criar nova tarefa e retornar com ID único
 */
router.post('/', validateCreateTask, async (req: Request, res: Response): Promise<void> => {
  try {
    const newTask = await taskController.create(req.body);
    
    res.status(201).json(newTask);
  } catch (error) {
    logger.error({ error, message: 'Erro ao criar tarefa' });
    
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Erro ao criar tarefa'
    });
  }
});

/**
 * PUT /api/tasks/:id
 * 
 * Atualiza uma tarefa existente
 * 
 * @param id - ID da tarefa (validado pelo middleware validateTaskId)
 * @body title - Título da tarefa (opcional, 1-255 caracteres se fornecido)
 * @body description - Descrição da tarefa (opcional)
 * @body completed - Status de conclusão (opcional)
 * @returns 200 OK com a tarefa atualizada
 * @returns 400 Bad Request se o ID ou dados forem inválidos
 * @returns 404 Not Found se a tarefa não existir
 * @returns 500 Internal Server Error em caso de erro no servidor
 * 
 * Requisito 1.4: Atualizar tarefa existente e retornar versão atualizada
 * Requisito 1.6: Retornar erro apropriado para ID inválido
 */
router.put('/:id', validateTaskId, validateUpdateTask, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const updatedTask = await taskController.update(id, req.body);
    
    if (!updatedTask) {
      res.status(404).json({
        error: 'NotFoundError',
        message: `Tarefa com ID ${id} não encontrada`
      });
      return;
    }
    
    res.status(200).json(updatedTask);
  } catch (error) {
    logger.error({ error, message: 'Erro ao atualizar tarefa' });
    
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Erro ao atualizar tarefa'
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * 
 * Remove uma tarefa do banco de dados
 * 
 * @param id - ID da tarefa (validado pelo middleware validateTaskId)
 * @returns 204 No Content se a tarefa foi deletada com sucesso
 * @returns 400 Bad Request se o ID for inválido
 * @returns 404 Not Found se a tarefa não existir
 * @returns 500 Internal Server Error em caso de erro no servidor
 * 
 * Requisito 1.5: Remover tarefa do banco de dados
 * Requisito 1.6: Retornar erro apropriado para ID inválido
 */
router.delete('/:id', validateTaskId, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const deleted = await taskController.deleteTask(id);
    
    if (!deleted) {
      res.status(404).json({
        error: 'NotFoundError',
        message: `Tarefa com ID ${id} não encontrada`
      });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error({ error, message: 'Erro ao deletar tarefa' });
    
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Erro ao deletar tarefa'
    });
  }
});

export default router;
