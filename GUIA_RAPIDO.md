# 🚀 Guia Rápido - Todo API

**Do zero ao funcionamento em 5 minutos!**

Este guia mostra o passo a passo completo para rodar a aplicação pela primeira vez.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ **Node.js 18+** - [Download aqui](https://nodejs.org/)
- ✅ **Docker Desktop** - [Download aqui](https://www.docker.com/products/docker-desktop/)
- ✅ **Git** - [Download aqui](https://git-scm.com/)

**Verificar instalação:**
```bash
node --version    # Deve mostrar v18.x.x ou superior
docker --version  # Deve mostrar Docker version 20.x.x ou superior
git --version     # Deve mostrar git version 2.x.x ou superior
```

---

## 🎯 Passo a Passo

### **Passo 1: Clonar o Repositório**

```bash
# Clone o projeto
git clone https://github.com/jmarcelotse/api-node-typescript-express-drizzle-k6.git

# Entre no diretório
cd api-node-typescript-express-drizzle-k6
```

**✅ Resultado esperado:** Você está dentro da pasta do projeto

---

### **Passo 2: Instalar Dependências**

```bash
npm install
```

**✅ Resultado esperado:** 
```
added 500+ packages in 30s
```

**⏱️ Tempo:** ~30 segundos

---

### **Passo 3: Configurar Variáveis de Ambiente**

```bash
# Copiar o arquivo de exemplo
cp .env.example .env
```

**✅ Resultado esperado:** Arquivo `.env` criado

**📝 Conteúdo do .env (já configurado):**
```env
# Banco de Dados
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=todo_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Aplicação
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

**💡 Dica:** Não precisa alterar nada, as configurações padrão funcionam!

---

### **Passo 4: Iniciar o Banco de Dados (PostgreSQL)**

```bash
# Iniciar PostgreSQL no Docker
docker compose up -d
```

**✅ Resultado esperado:**
```
[+] Running 2/2
 ✔ Network api-node-typescript-express-drizzle-k6_default    Created
 ✔ Container todo-api-postgres                                Started
```

**Verificar se está rodando:**
```bash
docker compose ps
```

**✅ Deve mostrar:**
```
NAME                IMAGE                COMMAND                  STATUS
todo-api-postgres   postgres:15-alpine   "docker-entrypoint.s…"   Up (healthy)
```

**⏱️ Tempo:** ~10 segundos

---

### **Passo 5: Rodar a Aplicação**

```bash
npm run dev
```

**✅ Resultado esperado:**
```
🚀 Iniciando Todo API...
📊 Testando conexão com o banco de dados...
✅ Conexão com o banco de dados estabelecida com sucesso
✅ Drizzle ORM inicializado!
🚀 Servidor rodando na porta 3000
📍 Health check: http://localhost:3000/health
📍 API: http://localhost:3000/api/tasks
```

**🎉 Pronto! A API está rodando!**

**⏱️ Tempo:** ~2 segundos

---

## 🧪 Passo 6: Testar a API

### **Teste 1: Health Check**

Abra outro terminal e execute:

```bash
curl http://localhost:3000/health
```

**✅ Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-31T12:00:00.000Z"
}
```

---

### **Teste 2: Criar uma Tarefa**

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Minha primeira tarefa",
    "description": "Testando a API",
    "completed": false
  }'
```

**✅ Resposta esperada:**
```json
{
  "id": 1,
  "title": "Minha primeira tarefa",
  "description": "Testando a API",
  "completed": false,
  "createdAt": "2026-01-31T12:00:00.000Z",
  "updatedAt": "2026-01-31T12:00:00.000Z"
}
```

---

### **Teste 3: Listar Todas as Tarefas**

```bash
curl http://localhost:3000/api/tasks
```

**✅ Resposta esperada:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Minha primeira tarefa",
      "description": "Testando a API",
      "completed": false,
      "createdAt": "2026-01-31T12:00:00.000Z",
      "updatedAt": "2026-01-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### **Teste 4: Atualizar uma Tarefa**

```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

**✅ Resposta esperada:**
```json
{
  "id": 1,
  "title": "Minha primeira tarefa",
  "description": "Testando a API",
  "completed": true,
  "createdAt": "2026-01-31T12:00:00.000Z",
  "updatedAt": "2026-01-31T12:01:00.000Z"
}
```

---

### **Teste 5: Deletar uma Tarefa**

```bash
curl -X DELETE http://localhost:3000/api/tasks/1
```

**✅ Resposta esperada:** Status 204 (sem corpo de resposta)

---

## 🧪 Passo 7: Executar os Testes

```bash
npm test
```

**✅ Resultado esperado:**
```
 ✓ tests/property/http.properties.test.ts (3 tests)
 ✓ tests/property/crud.properties.test.ts (4 tests)
 ✓ tests/property/validation.properties.test.ts (3 tests)
 ✓ tests/unit/middleware/requestLogger.test.ts (17 tests)
 ✓ tests/unit/controllers/task.controller.test.ts (29 tests)
 ✓ tests/integration/requestLogger.integration.test.ts (10 tests)
 ✓ tests/integration/task.routes.integration.test.ts (25 tests)
 ✓ tests/db/migration.test.ts (11 tests)
 ✓ tests/unit/db/connection.test.ts (6 tests)
 ✓ tests/unit/config/logger.test.ts (10 tests)
 ✓ tests/unit/middleware/validation.test.ts (24 tests)
 ✓ tests/integration/logger.integration.test.ts (12 tests)
 ✓ tests/unit/schema.test.ts (7 tests)

 Test Files  13 passed (13)
      Tests  161 passed (161)
   Duration  6.91s
```

**🎉 161 testes passando!**

**⏱️ Tempo:** ~7 segundos

---

## 🛑 Parar a Aplicação

### **Parar o servidor Node.js:**
Pressione `Ctrl + C` no terminal onde está rodando `npm run dev`

### **Parar o PostgreSQL:**
```bash
docker compose down
```

**✅ Resultado esperado:**
```
[+] Running 2/2
 ✔ Container todo-api-postgres  Removed
 ✔ Network api-node-typescript-express-drizzle-k6_default  Removed
```

---

## 🔄 Reiniciar Tudo

```bash
# 1. Iniciar banco de dados
docker compose up -d

# 2. Iniciar aplicação
npm run dev
```

---

## 📊 Resumo dos Comandos

| Ação | Comando |
|------|---------|
| Instalar dependências | `npm install` |
| Iniciar banco de dados | `docker compose up -d` |
| Rodar aplicação | `npm run dev` |
| Executar testes | `npm test` |
| Parar banco de dados | `docker compose down` |
| Ver logs do banco | `docker compose logs postgres` |
| Acessar banco via psql | `docker compose exec postgres psql -U postgres -d todo_db` |

---

## 🐛 Problemas Comuns

### **Erro: "Port 3000 already in use"**

**Solução:** Outra aplicação está usando a porta 3000

```bash
# Linux/Mac: Encontrar e matar o processo
lsof -ti:3000 | xargs kill -9

# Windows: Encontrar e matar o processo
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou altere a porta no arquivo .env
PORT=3001
```

---

### **Erro: "Cannot connect to database"**

**Solução:** PostgreSQL não está rodando

```bash
# Verificar se o container está rodando
docker compose ps

# Se não estiver, iniciar
docker compose up -d

# Verificar logs
docker compose logs postgres
```

---

### **Erro: "Docker daemon is not running"**

**Solução:** Docker Desktop não está aberto

1. Abra o Docker Desktop
2. Aguarde inicializar (ícone fica verde)
3. Execute `docker compose up -d` novamente

---

### **Erro: "npm: command not found"**

**Solução:** Node.js não está instalado

1. Baixe e instale o Node.js: https://nodejs.org/
2. Reinicie o terminal
3. Verifique: `node --version`

---

## 📚 Próximos Passos

Agora que você tem a API rodando, explore:

1. **Documentação completa:** Leia `README.md`
2. **Endpoints da API:** Veja todos os endpoints disponíveis
3. **Testes de carga:** Execute `npm run load:test` (requer k6)
4. **Drizzle Studio:** Execute `npm run db:studio` para ver o banco visualmente
5. **Modificar código:** Edite arquivos em `src/` e veja hot reload funcionando

---

## 🎯 Checklist de Sucesso

Marque conforme for completando:

- [ ] Node.js instalado e funcionando
- [ ] Docker Desktop instalado e rodando
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado
- [ ] PostgreSQL rodando no Docker
- [ ] Aplicação rodando (`npm run dev`)
- [ ] Health check funcionando
- [ ] Tarefa criada via API
- [ ] Testes executados com sucesso (161 passando)

---

## 💡 Dicas Extras

### **Usar Postman ou Insomnia**

Se preferir uma interface gráfica para testar a API:

1. Baixe [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/)
2. Importe a coleção de endpoints
3. Teste visualmente

### **Ver Logs Estruturados**

Os logs da aplicação são estruturados em JSON:

```bash
npm run dev
```

Você verá logs coloridos e formatados com:
- Timestamp
- Nível (INFO, WARN, ERROR)
- Contexto (método HTTP, URL, tempo de resposta)

### **Explorar o Banco de Dados**

```bash
# Abrir Drizzle Studio (interface visual)
npm run db:studio

# Ou acessar via psql
docker compose exec postgres psql -U postgres -d todo_db

# Comandos úteis no psql:
\dt              # Listar tabelas
\d tasks         # Ver estrutura da tabela tasks
SELECT * FROM tasks;  # Ver todos os dados
\q               # Sair
```

---

## 🎉 Parabéns!

Você configurou e rodou com sucesso uma REST API completa com:

- ✅ Node.js + TypeScript
- ✅ Express.js
- ✅ PostgreSQL
- ✅ Drizzle ORM
- ✅ Validação com Zod
- ✅ Logging com Pino
- ✅ 161 testes passando
- ✅ Docker containerizado

---

## 📞 Precisa de Ajuda?

- 📖 Documentação completa: `README.md`
- 🔧 Guia de setup: `SETUP.md`
- 🗄️ Guia de migrations: `MIGRATIONS.md`
- 🐛 Issues no GitHub: [Criar issue](https://github.com/jmarcelotse/api-node-typescript-express-drizzle-k6/issues)

---

**Tempo total estimado:** 5-10 minutos ⏱️

**Última atualização:** 31/01/2026
