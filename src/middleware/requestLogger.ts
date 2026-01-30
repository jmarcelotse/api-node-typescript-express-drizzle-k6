import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Middleware de logging para requisições HTTP
 * 
 * Registra informações sobre todas as requisições recebidas pela API:
 * - Método HTTP (GET, POST, PUT, DELETE, etc.)
 * - URL da requisição
 * - Status code da resposta
 * - Tempo de resposta em milissegundos
 * 
 * O middleware captura o início da requisição, intercepta o método res.end()
 * para calcular o tempo de resposta, e loga as informações quando a resposta
 * é enviada ao cliente.
 * 
 * Requirements: 5.2
 */

/**
 * Middleware que loga todas as requisições HTTP
 * 
 * @param req - Objeto de requisição do Express
 * @param res - Objeto de resposta do Express
 * @param next - Função para passar para o próximo middleware
 * 
 * @example
 * ```typescript
 * import { requestLogger } from './middleware/requestLogger';
 * 
 * app.use(requestLogger);
 * ```
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Captura o timestamp de início da requisição
  const startTime = Date.now();
  
  // Armazena o método original res.end para poder interceptá-lo
  const originalEnd = res.end;
  
  // Sobrescreve o método res.end para capturar quando a resposta é enviada
  res.end = function(this: Response, chunk?: any, encoding?: any, callback?: any): Response {
    // Calcula o tempo de resposta em milissegundos
    const responseTime = Date.now() - startTime;
    
    // Loga as informações da requisição
    logger.info({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.socket.remoteAddress,
    }, 'Requisição HTTP processada');
    
    // Chama o método original res.end para enviar a resposta
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  // Passa para o próximo middleware
  next();
}
