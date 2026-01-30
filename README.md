# Todo API - REST API com Node.js, TypeScript, Express e PostgreSQL

API RESTful completa para gerenciamento de tarefas (todo app) construída com Node.js, TypeScript, Express, PostgreSQL, Drizzle-ORM, sistema de logging e testes de carga com Grafana k6.

## 🚀 Tecnologias

- **Runtime**: Node.js com TypeScript
- **Web Framework**: Express.js
- **Database**: PostgreSQL (Docker)
- **ORM**: Drizzle-ORM
- **Validation**: Zod
- **Testing**: Vitest + fast-check (property-based testing)
- **Load Testing**: Grafana k6
- **Logging**: Pino (logger estruturado de alta performance)

## 📋 Pré-requisitos

- Node.js 18+ 
- Docker e Docker Compose
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/jmarcelotse/api-node-typescript-express-drizzle-k6.git
cd api-node-typescript-express-drizzle-k6
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

4. Inicie o banco de dados PostgreSQL com Docker Compose:
```bash
docker compose up -d
```

5. Verifique se o container está rodando:
```bash
docker compose ps
```

6. Para parar o banco de dados:
```bash
docker compose down
```

7. Para parar e remover os dados (cuidado!):
```bash
docker compose down -v
```

## 🏃 Executando a Aplicação

### Banco de Dados PostgreSQL

O projeto utiliza PostgreSQL rodando em container Docker. O Docker Compose está configurado com:

- **Imagem**: postgres:15-alpine (leve e otimizada)
- **Porta**: 5432 (mapeada para localhost)
- **Database**: todo_db
- **Usuário**: postgres
- **Senha**: postgres
- **Volume**: Dados persistidos em volume nomeado `postgres_data`
- **Health Check**: Verifica automaticamente se o banco está pronto

**Comandos úteis do Docker:**

```bash
# Iniciar o banco de dados
docker compose up -d

# Ver logs do PostgreSQL
docker compose logs postgres

# Ver logs em tempo real
docker compose logs -f postgres

# Verificar status do container
docker compose ps

# Acessar o PostgreSQL via psql
docker compose exec postgres psql -U postgres -d todo_db

# Parar o banco de dados
docker compose down

# Parar e remover volumes (apaga todos os dados!)
docker compose down -v

# Reiniciar o container
docker compose restart postgres
```

### Modo Desenvolvimento
```bash
npm run dev
```

A aplicação irá:
1. Carregar as variáveis de ambiente do arquivo `.env`
2. Estabelecer conexão com o PostgreSQL
3. Inicializar o Drizzle ORM
4. Aguardar implementação das próximas tarefas (rotas, controllers, etc.)

**Nota**: Certifique-se de que o PostgreSQL está rodando antes de iniciar a aplicação:
```bash
docker compose up -d
```

### Build para Produção
```bash
npm run build
npm start
```

## 🔌 Conexão com Banco de Dados

O módulo de conexão (`src/db/connection.ts`) implementa:

- **Singleton Pattern**: Garante uma única instância de conexão durante o ciclo de vida da aplicação
- **Configuração via Variáveis de Ambiente**: Todas as credenciais são carregadas do arquivo `.env`
- **Tratamento de Erros**: Erros de conexão são capturados e logados adequadamente
- **Pool de Conexões**: Configurado com máximo de 10 conexões simultâneas
- **Encerramento Gracioso**: Fecha conexões adequadamente quando a aplicação é encerrada

**Funções disponíveis:**

- `getConnection()`: Retorna a instância do Drizzle ORM (cria se não existir)
- `testConnection()`: Testa se a conexão está funcionando
- `closeConnection()`: Fecha a conexão com o banco de dados
- `getDatabaseConfig()`: Obtém configurações do banco das variáveis de ambiente

**Exemplo de uso:**

```typescript
import { getConnection } from './db/connection';

// Obtém a instância do Drizzle ORM
const db = getConnection();

// Executa queries usando o Drizzle
const tasks = await db.select().from(tasksTable);
```

## 📊 Sistema de Logging

O projeto utiliza **Pino** como biblioteca de logging, oferecendo:

- **Alta Performance**: Um dos loggers mais rápidos para Node.js
- **Logs Estruturados**: Formato JSON para fácil parsing e análise
- **Níveis de Log**: debug, info, warn, error
- **Pretty Print**: Logs coloridos e formatados em desenvolvimento
- **Child Loggers**: Contexto específico por módulo ou requisição

### Configuração

O logger é configurado em `src/config/logger.ts` e respeita as seguintes variáveis de ambiente:

- `LOG_LEVEL`: Nível mínimo de log (debug, info, warn, error) - padrão: info em produção, debug em desenvolvimento
- `NODE_ENV`: Ambiente de execução (development, production, test)

### Uso Básico

```typescript
import { logger } from './config/logger';

// Log de informação simples
logger.info('Servidor iniciado com sucesso');

// Log com metadata estruturada
logger.info({ port: 3000, env: 'development' }, 'Servidor escutando');

// Log de erro com stack trace
logger.error({ err: error }, 'Erro ao processar requisição');

// Log de warning
logger.warn({ responseTime: 5000 }, 'Resposta lenta detectada');

// Log de debug (apenas em desenvolvimento)
logger.debug({ data: requestBody }, 'Dados recebidos');
```

### Child Loggers

Para adicionar contexto específico a um conjunto de logs:

```typescript
// Logger específico para um módulo
const dbLogger = logger.child({ module: 'database' });
dbLogger.info('Conexão estabelecida');

// Logger específico para uma requisição
const requestLogger = logger.child({ 
  requestId: 'req-123',
  userId: 456 
});
requestLogger.info('Iniciando processamento');
requestLogger.info('Operação finalizada');
```

### Exemplos de Uso

Consulte `src/config/logger.example.ts` para exemplos detalhados de uso em diferentes cenários:
- Logging de requisições HTTP
- Logging de operações de banco de dados
- Logging de erros e warnings
- Logging de métricas
- Logging estruturado para análise

### Formato dos Logs

**Desenvolvimento** (com pino-pretty):
```
[2024-01-29 16:37:31.555 -0300] INFO: Servidor iniciado
    env: "development"
    port: 3000
```

**Produção** (JSON estruturado):
```json
{
  "level": "info",
  "time": "2024-01-29T19:37:31.555Z",
  "env": "production",
  "port": 3000,
  "msg": "Servidor iniciado"
}
```

## ✅ Validação de Dados

O projeto utiliza **Zod** para validação de schemas TypeScript, oferecendo:

- **Type Safety**: Validação em runtime com inferência de tipos TypeScript
- **Mensagens de Erro Descritivas**: Erros claros e específicos para cada campo
- **Validação Automática**: Middleware que valida automaticamente os payloads
- **Transformações**: Limpeza e normalização de dados (ex: trim em strings)

### Schemas de Validação

#### Criação de Tarefa (POST /api/tasks)
```typescript
{
  title: string,        // Obrigatório, 1-255 caracteres, não-vazio
  description?: string, // Opcional
  completed?: boolean   // Opcional, padrão: false
}
```

#### Atualização de Tarefa (PUT /api/tasks/:id)
```typescript
{
  title?: string,       // Opcional, 1-255 caracteres se fornecido
  description?: string, // Opcional
  completed?: boolean   // Opcional
}
// Pelo menos um campo deve ser fornecido
```

#### Validação de ID
- Deve ser um número inteiro positivo
- Rejeita decimais, negativos e não-numéricos

### Formato de Erro de Validação

Quando a validação falha, a API retorna status 400 com detalhes:

```json
{
  "error": "ValidationError",
  "message": "Dados de entrada inválidos",
  "details": [
    {
      "field": "title",
      "message": "O campo title não pode estar vazio"
    },
    {
      "field": "completed",
      "message": "O campo completed deve ser um boolean"
    }
  ]
}
```

### Uso nos Middlewares

Os middlewares de validação são aplicados automaticamente nas rotas:

```typescript
import { validateCreateTask, validateUpdateTask, validateTaskId } from './middleware/validation';

// Validar criação
router.post('/tasks', validateCreateTask, createTaskHandler);

// Validar atualização (ID + payload)
router.put('/tasks/:id', validateTaskId, validateUpdateTask, updateTaskHandler);

// Validar apenas ID
router.get('/tasks/:id', validateTaskId, getTaskHandler);
router.delete('/tasks/:id', validateTaskId, deleteTaskHandler);
```

**Requisitos atendidos:**
- 4.6: Validação de payloads de requisição
- 7.1: Retorno de 400 Bad Request com detalhes de erro
- 8.2: Validação de title obrigatório (1-255 chars)

## 🧪 Testes

### Executar todos os testes
```bash
npm test
```

### Testes unitários
```bash
npm run test:unit
```

### Testes baseados em propriedades
```bash
npm run test:property
```

### Testes de integração
```bash
npm run test:integration
```

### Testes com interface visual
```bash
npm run test:ui
```

### Testes de carga (k6)

**Nota**: É necessário ter o k6 instalado. Para instalar:

```bash
# macOS (via Homebrew)
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (via Chocolatey)
choco install k6

# Ou via Docker
docker pull grafana/k6
```

Executar testes de carga:
```bash
# Com k6 instalado localmente
npm run load:test

# Ou via Docker
docker run --rm -i --network=host grafana/k6 run - <tests/load/k6-script.js
```

## 📁 Estrutura do Projeto

```
todo-api/
├── src/
│   ├── config/          # Configurações (database, logger)
│   ├── db/              # Schema e conexão do banco
│   ├── controllers/     # Lógica de negócio
│   ├── routes/          # Rotas REST
│   ├── middleware/      # Middleware (validação, erros, logging)
│   ├── types/           # Tipos TypeScript
│   └── index.ts         # Entry point
├── tests/
│   ├── unit/            # Testes unitários
│   ├── property/        # Testes baseados em propriedades
│   ├── integration/     # Testes de integração
│   └── load/            # Scripts k6
├── config/              # Arquivos de configuração
└── docker-compose.yml   # Configuração Docker
```

## 📝 Status da Implementação

- [x] Tarefa 1: Setup inicial do projeto
- [x] Tarefa 2: Configurar Docker Compose e PostgreSQL
- [x] Tarefa 3.1: Criar schema de tasks com Drizzle
- [x] Tarefa 3.2: Configurar conexão com banco de dados
- [x] Tarefa 3.3: Configurar Drizzle Kit para migrações
- [x] Tarefa 4.1: Configurar logger (Pino)
- [x] Tarefa 4.2: Criar middleware de logging para requisições
- [x] Tarefa 5: Implementar validação de dados
- [x] Tarefa 6: Implementar Task Controller
- [x] Tarefa 7: Implementar rotas REST
- [x] Tarefa 8: Implementar tratamento de erros
- [x] Tarefa 9: Configurar aplicação Express
- [x] Tarefa 10: Checkpoint - Testar API manualmente
- [x] Tarefa 11: Implementar testes baseados em propriedades
- [x] Tarefa 12: Configurar testes de carga com k6
- [x] Tarefa 13: Documentação e finalização
- [ ] Tarefa 14: Checkpoint final - Validação completa

## 📚 Documentação da API

### Endpoints Disponíveis

#### Health Check
```
GET /health
```
Verifica se a API está funcionando.

**Resposta de Sucesso (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-29T19:00:00.000Z",
  "uptime": 123.456
}
```

#### Listar Todas as Tarefas
```
GET /api/tasks
```
Retorna todas as tarefas cadastradas.

**Resposta de Sucesso (200 OK):**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Minha tarefa",
      "description": "Descrição da tarefa",
      "completed": false,
      "createdAt": "2024-01-29T19:00:00.000Z",
      "updatedAt": "2024-01-29T19:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Obter Tarefa por ID
```
GET /api/tasks/:id
```
Retorna uma tarefa específica.

**Parâmetros:**
- `id` (number): ID da tarefa

**Resposta de Sucesso (200 OK):**
```json
{
  "id": 1,
  "title": "Minha tarefa",
  "description": "Descrição da tarefa",
  "completed": false,
  "createdAt": "2024-01-29T19:00:00.000Z",
  "updatedAt": "2024-01-29T19:00:00.000Z"
}
```

**Resposta de Erro (404 Not Found):**
```json
{
  "error": "NotFoundError",
  "message": "Tarefa com ID 1 não encontrada"
}
```

#### Criar Nova Tarefa
```
POST /api/tasks
```
Cria uma nova tarefa.

**Body:**
```json
{
  "title": "Minha nova tarefa",
  "description": "Descrição opcional",
  "completed": false
}
```

**Campos:**
- `title` (string, obrigatório): Título da tarefa (1-255 caracteres)
- `description` (string, opcional): Descrição da tarefa
- `completed` (boolean, opcional): Status de conclusão (padrão: false)

**Resposta de Sucesso (201 Created):**
```json
{
  "id": 1,
  "title": "Minha nova tarefa",
  "description": "Descrição opcional",
  "completed": false,
  "createdAt": "2024-01-29T19:00:00.000Z",
  "updatedAt": "2024-01-29T19:00:00.000Z"
}
```

**Resposta de Erro (400 Bad Request):**
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

#### Atualizar Tarefa
```
PUT /api/tasks/:id
```
Atualiza uma tarefa existente.

**Parâmetros:**
- `id` (number): ID da tarefa

**Body:**
```json
{
  "title": "Título atualizado",
  "description": "Nova descrição",
  "completed": true
}
```

**Campos (todos opcionais, mas pelo menos um deve ser fornecido):**
- `title` (string): Novo título (1-255 caracteres)
- `description` (string): Nova descrição
- `completed` (boolean): Novo status de conclusão

**Resposta de Sucesso (200 OK):**
```json
{
  "id": 1,
  "title": "Título atualizado",
  "description": "Nova descrição",
  "completed": true,
  "createdAt": "2024-01-29T19:00:00.000Z",
  "updatedAt": "2024-01-29T19:05:00.000Z"
}
```

#### Deletar Tarefa
```
DELETE /api/tasks/:id
```
Remove uma tarefa.

**Parâmetros:**
- `id` (number): ID da tarefa

**Resposta de Sucesso (204 No Content):**
Sem corpo de resposta.

**Resposta de Erro (404 Not Found):**
```json
{
  "error": "NotFoundError",
  "message": "Tarefa com ID 1 não encontrada"
}
```

### Exemplos de Uso com cURL

```bash
# Criar uma tarefa
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Minha tarefa","description":"Descrição","completed":false}'

# Listar todas as tarefas
curl http://localhost:3000/api/tasks

# Obter uma tarefa específica
curl http://localhost:3000/api/tasks/1

# Atualizar uma tarefa
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Tarefa atualizada","completed":true}'

# Deletar uma tarefa
curl -X DELETE http://localhost:3000/api/tasks/1
```

### Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida (GET, PUT)
- `201 Created`: Recurso criado com sucesso (POST)
- `204 No Content`: Recurso deletado com sucesso (DELETE)
- `400 Bad Request`: Dados de entrada inválidos
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## 🤝 Contribuindo

Este projeto está em desenvolvimento ativo. Contribuições são bem-vindas!

## 📄 Licença

ISC
