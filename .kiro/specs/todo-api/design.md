# Design Document: Todo API

## Overview

Esta REST API fornece um sistema completo de gerenciamento de tarefas (todo app) construído com Node.js, TypeScript, Express, PostgreSQL e Drizzle-ORM. A arquitetura segue princípios RESTful, com separação clara entre camadas de roteamento, lógica de negócio e acesso a dados. O sistema inclui logging estruturado para monitoramento e testes de carga com Grafana k6 para validação de performance.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   HTTP Client   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express Router │ ◄─── Logger
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controllers   │ ◄─── Validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Drizzle ORM    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │ (Docker)
└─────────────────┘
```

### Technology Stack

- **Runtime**: Node.js com TypeScript
- **Web Framework**: Express.js
- **Database**: PostgreSQL (containerizado via Docker-Compose)
- **ORM**: Drizzle-ORM
- **Logging**: Winston ou Pino
- **Load Testing**: Grafana k6
- **Validation**: Zod (para validação de schemas TypeScript)

### Layered Architecture

1. **HTTP Layer**: Express routes e middleware
2. **Controller Layer**: Lógica de negócio e orquestração
3. **Data Access Layer**: Drizzle-ORM queries
4. **Database Layer**: PostgreSQL

## Components and Interfaces

### 1. Express Application

**Responsabilidade**: Configurar servidor HTTP, middleware e rotas

```typescript
interface ExpressApp {
  // Inicializa o servidor Express
  initialize(): void;
  
  // Configura middleware (JSON parsing, CORS, logging)
  setupMiddleware(): void;
  
  // Registra rotas da API
  setupRoutes(): void;
  
  // Inicia o servidor na porta especificada
  start(port: number): void;
}
```

### 2. Task Router

**Responsabilidade**: Definir endpoints REST para operações de tarefas

```typescript
interface TaskRouter {
  // GET /api/tasks - Lista todas as tarefas
  getTasks(req: Request, res: Response): Promise<void>;
  
  // GET /api/tasks/:id - Obtém uma tarefa específica
  getTaskById(req: Request, res: Response): Promise<void>;
  
  // POST /api/tasks - Cria uma nova tarefa
  createTask(req: Request, res: Response): Promise<void>;
  
  // PUT /api/tasks/:id - Atualiza uma tarefa existente
  updateTask(req: Request, res: Response): Promise<void>;
  
  // DELETE /api/tasks/:id - Remove uma tarefa
  deleteTask(req: Request, res: Response): Promise<void>;
}
```

### 3. Task Controller

**Responsabilidade**: Implementar lógica de negócio para operações de tarefas

```typescript
interface TaskController {
  // Lista todas as tarefas do banco
  findAll(): Promise<Task[]>;
  
  // Busca uma tarefa por ID
  findById(id: number): Promise<Task | null>;
  
  // Cria uma nova tarefa
  create(data: CreateTaskInput): Promise<Task>;
  
  // Atualiza uma tarefa existente
  update(id: number, data: UpdateTaskInput): Promise<Task | null>;
  
  // Remove uma tarefa
  delete(id: number): Promise<boolean>;
}
```

### 4. Database Connection

**Responsabilidade**: Gerenciar conexão com PostgreSQL via Drizzle-ORM

```typescript
interface DatabaseConnection {
  // Estabelece conexão com o banco
  connect(config: DatabaseConfig): Promise<void>;
  
  // Retorna instância do Drizzle client
  getClient(): DrizzleClient;
  
  // Fecha conexão com o banco
  disconnect(): Promise<void>;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
```

### 5. Logger

**Responsabilidade**: Registrar eventos, erros e informações de debug

```typescript
interface Logger {
  // Log de informação geral
  info(message: string, metadata?: object): void;
  
  // Log de erro
  error(message: string, error?: Error, metadata?: object): void;
  
  // Log de warning
  warn(message: string, metadata?: object): void;
  
  // Log de debug (apenas em desenvolvimento)
  debug(message: string, metadata?: object): void;
}
```

### 6. Validation Middleware

**Responsabilidade**: Validar payloads de requisições

```typescript
interface ValidationMiddleware {
  // Valida payload de criação de tarefa
  validateCreateTask(req: Request, res: Response, next: NextFunction): void;
  
  // Valida payload de atualização de tarefa
  validateUpdateTask(req: Request, res: Response, next: NextFunction): void;
  
  // Valida parâmetro ID
  validateTaskId(req: Request, res: Response, next: NextFunction): void;
}
```

## Data Models

### Task Schema (Drizzle-ORM)

```typescript
// Schema definition usando Drizzle-ORM
const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types inferidos do schema
type Task = typeof tasks.$inferSelect;
type CreateTaskInput = typeof tasks.$inferInsert;
type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'id' | 'createdAt'>>;
```

### API Request/Response Types

```typescript
// POST /api/tasks - Request body
interface CreateTaskRequest {
  title: string;          // Required, 1-255 characters
  description?: string;   // Optional
  completed?: boolean;    // Optional, defaults to false
}

// PUT /api/tasks/:id - Request body
interface UpdateTaskRequest {
  title?: string;         // Optional, 1-255 characters if provided
  description?: string;   // Optional
  completed?: boolean;    // Optional
}

// Response for single task
interface TaskResponse {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;      // ISO 8601 format
  updatedAt: string;      // ISO 8601 format
}

// Response for task list
interface TaskListResponse {
  tasks: TaskResponse[];
  count: number;
}

// Error response
interface ErrorResponse {
  error: string;
  message: string;
  details?: object;
}
```

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*


### Property Reflection

Analisando as propriedades identificadas no prework, vou consolidar propriedades redundantes:

- Propriedades 8.1-8.6 sobre estrutura de dados podem ser combinadas em uma propriedade abrangente sobre validação de schema
- Propriedades 7.1-7.4 sobre códigos de erro podem ser agrupadas por tipo de erro
- Propriedades 5.2-5.4 sobre logging podem ser consolidadas em uma propriedade sobre logging de operações

### CRUD Operations Properties

**Property 1: Task Creation Round Trip**
*For any* valid task data (title, optional description, optional completed status), creating a task via POST /api/tasks should return a task object with a unique ID and the same data, and retrieving that task by ID should return equivalent data.
**Validates: Requirements 1.1, 1.3**

**Property 2: Task List Completeness**
*For any* set of created tasks, calling GET /api/tasks should return all tasks that were created and not deleted, with the count matching the number of tasks.
**Validates: Requirements 1.2**

**Property 3: Task Update Preserves Identity**
*For any* existing task and valid update data, updating the task via PUT /api/tasks/:id should preserve the task ID and createdAt timestamp while updating only the specified fields and the updatedAt timestamp.
**Validates: Requirements 1.4**

**Property 4: Task Deletion Removes Task**
*For any* existing task, deleting it via DELETE /api/tasks/:id should result in subsequent GET requests for that ID returning 404 Not Found.
**Validates: Requirements 1.5**

**Property 5: Invalid ID Returns Error**
*For any* invalid task ID (non-numeric, negative, or non-existent), requests to GET, PUT, or DELETE that task should return an appropriate error response (400 or 404).
**Validates: Requirements 1.6**

### Data Validation Properties

**Property 6: Schema Validation Enforcement**
*For any* task creation or update request, the API should enforce that: (1) title is required and non-empty for creation, (2) title is 1-255 characters if provided, (3) completed is boolean if provided, (4) created tasks have unique IDs, (5) timestamps are automatically set.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

**Property 7: Invalid Payloads Rejected**
*For any* request with invalid payload data (missing required fields, wrong types, constraint violations), the API should return 400 Bad Request with descriptive error details before processing.
**Validates: Requirements 4.6, 7.1**

**Property 8: Database Constraints Enforced**
*For any* attempt to violate database constraints (null title, invalid data types), the database should reject the operation and the API should return an appropriate error response.
**Validates: Requirements 2.5**

### HTTP Protocol Properties

**Property 9: Appropriate Status Codes**
*For any* API operation, the response should use appropriate HTTP status codes: 200 for successful GET/PUT, 201 for successful POST, 204 for successful DELETE, 400 for validation errors, 404 for not found, 500 for server errors.
**Validates: Requirements 4.5**

**Property 10: Error Responses Include Messages**
*For any* error condition (validation error, not found, server error), the API response should include a descriptive error message explaining what went wrong.
**Validates: Requirements 7.4**

**Property 11: Not Found Returns 404**
*For any* request for a non-existent resource (task ID that doesn't exist), the API should return 404 Not Found.
**Validates: Requirements 7.2**

**Property 12: Server Errors Return 500**
*For any* unhandled server error or database connection failure, the API should return 500 Internal Server Error.
**Validates: Requirements 7.3**

### Logging Properties

**Property 13: Operations Are Logged**
*For any* API request, database operation, or error, the logger should record the event with appropriate details (request info, operation type, error details) and severity level (info for requests, error for errors).
**Validates: Requirements 5.2, 5.3, 5.4**

**Property 14: Errors Logged Before Response**
*For any* error that occurs during request processing, the error details should be logged before the error response is sent to the client.
**Validates: Requirements 7.5**

**Property 15: Structured Log Format**
*For any* log message, it should follow a consistent structured format including timestamp, severity level, message, and optional metadata.
**Validates: Requirements 5.5**

### Database Connection Properties

**Property 16: Database Error Handling**
*For any* database operation failure (connection lost, query error, constraint violation), the API should handle the error gracefully and return an appropriate error response without crashing.
**Validates: Requirements 2.4**

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Missing required fields
   - Invalid data types
   - Constraint violations (title too long, etc.)
   - Malformed request body

2. **Not Found Errors (404)**
   - Task ID doesn't exist
   - Invalid endpoint

3. **Server Errors (500)**
   - Database connection failures
   - Unhandled exceptions
   - ORM errors

### Error Response Format

All errors follow a consistent JSON structure:

```typescript
{
  "error": "ErrorType",           // e.g., "ValidationError", "NotFoundError"
  "message": "Human-readable description",
  "details": {                    // Optional, for validation errors
    "field": "title",
    "issue": "Title is required"
  }
}
```

### Error Handling Flow

```
Request → Validation Middleware → Controller → Database
   ↓            ↓                      ↓           ↓
   └────────────┴──────────────────────┴───────────┘
                         ↓
                   Error Handler
                         ↓
                  Log Error
                         ↓
                  Format Response
                         ↓
                  Send to Client
```

## Testing Strategy

### Dual Testing Approach

A estratégia de testes combina testes unitários e testes baseados em propriedades para cobertura abrangente:

**Unit Tests**:
- Exemplos específicos de operações CRUD
- Casos de borda (strings vazias, IDs inválidos)
- Condições de erro específicas
- Integração entre componentes

**Property-Based Tests**:
- Propriedades universais que devem valer para todas as entradas
- Geração automática de dados de teste variados
- Validação de invariantes do sistema
- Mínimo de 100 iterações por teste de propriedade

### Property-Based Testing Configuration

**Framework**: fast-check (para TypeScript/Node.js)

**Configuração**:
```typescript
import fc from 'fast-check';

// Cada teste de propriedade deve:
// 1. Executar mínimo 100 iterações
// 2. Referenciar a propriedade do design
// 3. Usar tag no formato: Feature: todo-api, Property N: [texto]

fc.assert(
  fc.property(
    // generators aqui
    async (data) => {
      // test implementation
    }
  ),
  { numRuns: 100 }
);
```

**Generators Necessários**:
- `validTaskData()`: Gera dados válidos de tarefa
- `invalidTaskData()`: Gera dados inválidos para testes de validação
- `taskId()`: Gera IDs de tarefa válidos
- `invalidTaskId()`: Gera IDs inválidos (negativos, não-numéricos)
- `updateData()`: Gera dados de atualização parcial

### Test Organization

```
tests/
├── unit/
│   ├── controllers/
│   │   └── task.controller.test.ts
│   ├── routes/
│   │   └── task.routes.test.ts
│   └── validation/
│       └── task.validation.test.ts
├── property/
│   ├── crud.properties.test.ts
│   ├── validation.properties.test.ts
│   ├── http.properties.test.ts
│   └── logging.properties.test.ts
├── integration/
│   └── api.integration.test.ts
└── load/
    └── k6-script.js
```

### Load Testing with k6

**Objetivos**:
- Validar performance sob carga
- Identificar gargalos
- Verificar estabilidade com múltiplos usuários concorrentes

**Cenários de Teste**:
1. Carga constante: 10 usuários por 30 segundos
2. Rampa de carga: 0 → 50 usuários em 1 minuto
3. Stress test: 100 usuários por 2 minutos

**Métricas**:
- Response time (p95, p99)
- Requests per second
- Error rate
- Database connection pool usage

## Implementation Notes

### Project Structure

```
todo-api/
├── src/
│   ├── config/
│   │   ├── database.ts       # Database connection config
│   │   └── logger.ts         # Logger configuration
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema definitions
│   │   └── connection.ts     # Database connection setup
│   ├── controllers/
│   │   └── task.controller.ts
│   ├── routes/
│   │   └── task.routes.ts
│   ├── middleware/
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   ├── types/
│   │   └── task.types.ts
│   └── index.ts              # Application entry point
├── tests/
│   ├── unit/
│   ├── property/
│   ├── integration/
│   └── load/
├── docker-compose.yml
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

### Environment Variables

```
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=todo_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Application
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

### Docker Compose Configuration

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: todo_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Dependencies

**Core**:
- express: Web framework
- drizzle-orm: ORM
- postgres: PostgreSQL driver
- zod: Schema validation
- winston ou pino: Logging

**Development**:
- typescript: Type safety
- tsx: TypeScript execution
- drizzle-kit: Database migrations
- fast-check: Property-based testing
- vitest ou jest: Test runner
- k6: Load testing

### Migration Strategy

Usar Drizzle Kit para gerenciar migrações:

```bash
# Gerar migration
npx drizzle-kit generate:pg

# Aplicar migration
npx drizzle-kit push:pg
```
