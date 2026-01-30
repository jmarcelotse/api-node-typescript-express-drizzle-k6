# Middleware

Este diretório contém os middlewares da aplicação.

## Middlewares Disponíveis

### 1. Request Logger (`requestLogger.ts`)

Middleware que registra informações sobre todas as requisições HTTP recebidas pela API.

**Funcionalidades:**
- Registra método HTTP, URL, status code e tempo de resposta
- Usa o logger configurado (Pino)
- Executa automaticamente para todas as rotas

**Uso:**
```typescript
import { requestLogger } from './middleware/requestLogger';

app.use(requestLogger);
```

### 2. Validation (`validation.ts`)

Middleware que valida payloads de requisições usando Zod schemas.

**Funcionalidades:**
- Validação de criação de tarefas (`validateCreateTask`)
- Validação de atualização de tarefas (`validateUpdateTask`)
- Validação de parâmetros ID (`validateTaskId`)
- Retorna 400 Bad Request com detalhes de erro para dados inválidos
- Loga erros de validação

**Schemas de Validação:**

#### CreateTask
- `title`: obrigatório, string não-vazia, 1-255 caracteres
- `description`: opcional, string
- `completed`: opcional, boolean (padrão: false)

#### UpdateTask
- `title`: opcional, string não-vazia, 1-255 caracteres
- `description`: opcional, string
- `completed`: opcional, boolean
- Pelo menos um campo deve ser fornecido

#### TaskId
- Deve ser um número inteiro positivo

**Uso:**
```typescript
import { validateCreateTask, validateUpdateTask, validateTaskId } from './middleware/validation';

// Validar criação de tarefa
router.post('/tasks', validateCreateTask, createTaskHandler);

// Validar atualização de tarefa
router.put('/tasks/:id', validateTaskId, validateUpdateTask, updateTaskHandler);

// Validar ID em rotas GET/DELETE
router.get('/tasks/:id', validateTaskId, getTaskHandler);
router.delete('/tasks/:id', validateTaskId, deleteTaskHandler);
```

**Formato de Erro:**
```json
{
  "error": "ValidationError",
  "message": "Dados de entrada inválidos",
  "details": [
    {
      "field": "title",
      "message": "O campo title não pode estar vazio"
    }
  ]
}
```

## Requisitos Atendidos

- **4.6**: Validação de payloads de requisição
- **5.2**: Logging de requisições HTTP
- **7.1**: Retorno de 400 Bad Request com detalhes de erro
- **7.4**: Mensagens de erro descritivas
- **8.2**: Validação de title obrigatório (1-255 chars)
