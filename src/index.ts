import 'dotenv/config';
import express, { Express } from 'express';
import taskRoutes from './routes/task.routes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { getConnection, testConnection } from './db/connection';
import { logger } from './config/logger';

/**
 * Aplicação Express - Todo API
 * 
 * REST API completa para gerenciamento de tarefas com:
 * - Operações CRUD (Create, Read, Update, Delete)
 * - Validação de dados com Zod
 * - Persistência em PostgreSQL via Drizzle ORM
 * - Sistema de logging estruturado
 * - Tratamento de erros robusto
 * 
 * Requisitos atendidos:
 * - 4.1: Usar Express framework para HTTP routing
 * - 4.2: Escrito em TypeScript para type safety
 */

/**
 * Cria e configura a aplicação Express
 * 
 * @returns Aplicação Express configurada
 */
function createApp(): Express {
  const app = express();

  // Middleware para parsing de JSON (Requisito 4.1)
  app.use(express.json());

  // Middleware para parsing de URL-encoded data
  app.use(express.urlencoded({ extended: true }));

  // Middleware de logging de requisições (Requisito 5.2)
  app.use(requestLogger);

  // Rota de health check
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Registra rotas da API (Requisito 4.3)
  app.use('/api/tasks', taskRoutes);

  // Middleware para capturar rotas não encontradas (404)
  // Deve vir após todas as rotas válidas
  app.use(notFoundHandler);

  // Middleware de tratamento de erros (Requisito 7.1, 7.2, 7.3, 7.4, 7.5)
  // Deve ser o último middleware registrado
  app.use(errorHandler);

  return app;
}

/**
 * Inicializa a conexão com o banco de dados
 * 
 * @returns Promise<boolean> true se a conexão foi bem-sucedida
 */
async function initializeDatabase(): Promise<boolean> {
  try {
    logger.info('Inicializando conexão com o banco de dados...');
    
    // Estabelece conexão com o banco (Requisito 2.2)
    getConnection();
    
    // Testa a conexão
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Falha ao testar conexão com o banco de dados');
    }
    
    logger.info('Conexão com o banco de dados estabelecida com sucesso');
    return true;
  } catch (error) {
    logger.error({ error, message: 'Erro ao conectar com o banco de dados' });
    return false;
  }
}

/**
 * Inicia o servidor HTTP
 * 
 * @param app - Aplicação Express
 * @param port - Porta para o servidor escutar
 */
function startServer(app: Express, port: number): void {
  const server = app.listen(port, () => {
    logger.info({
      port,
      env: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    }, 'Servidor iniciado com sucesso');
    
    logger.info(`🚀 API disponível em http://localhost:${port}`);
    logger.info(`📊 Health check em http://localhost:${port}/health`);
    logger.info(`📝 Endpoints de tarefas em http://localhost:${port}/api/tasks`);
  });

  // Tratamento de erros do servidor
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Porta ${port} já está em uso`, error);
    } else {
      logger.error('Erro no servidor HTTP', error);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Sinal ${signal} recebido, encerrando servidor...`);
    
    server.close(async () => {
      logger.info('Servidor HTTP encerrado');
      
      try {
        const { closeConnection } = await import('./db/connection.js');
        await closeConnection();
        logger.info('Conexão com banco de dados encerrada');
      } catch (error) {
        logger.error({ error, message: 'Erro ao fechar conexão com banco de dados' });
      }
      
      process.exit(0);
    });

    // Força o encerramento após 10 segundos
    setTimeout(() => {
      logger.error('Forçando encerramento após timeout');
      process.exit(1);
    }, 10000);
  };

  // Registra handlers para sinais de encerramento
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Função principal de inicialização
 * 
 * Inicializa o banco de dados e inicia o servidor HTTP
 */
async function main(): Promise<void> {
  try {
    // Log de inicialização
    logger.info({
      env: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    }, 'Iniciando aplicação Todo API...');

    // Inicializa conexão com banco de dados
    const dbConnected = await initializeDatabase();
    
    if (!dbConnected) {
      logger.error('Não foi possível conectar ao banco de dados. Encerrando aplicação.');
      process.exit(1);
    }

    // Cria e configura a aplicação Express
    const app = createApp();

    // Obtém a porta das variáveis de ambiente ou usa 3000 como padrão
    const port = parseInt(process.env.PORT || '3000', 10);

    // Inicia o servidor
    startServer(app, port);

  } catch (error) {
    logger.error({ error, message: 'Erro fatal durante inicialização da aplicação' });
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error: Error) => {
  logger.error({ error, message: 'Exceção não capturada' });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error({
    reason: reason instanceof Error ? reason.message : reason,
    message: 'Promise rejection não tratada'
  });
  process.exit(1);
});

// Inicia a aplicação se este arquivo for executado diretamente
if (require.main === module) {
  main();
}

// Exporta a função createApp para testes
export { createApp };
