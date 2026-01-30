# Implementation Plan: Todo API

## Overview

Este plano de implementação detalha os passos para construir a REST API de lista de tarefas usando Node.js, TypeScript, Express, PostgreSQL, Drizzle-ORM, sistema de logging e testes de carga com k6. A implementação seguirá uma abordagem incremental, construindo e validando cada camada antes de prosseguir.

## Tasks

- [x] 1. Setup inicial do projeto e configuração base
  - Inicializar projeto Node.js com TypeScript
  - Configurar tsconfig.json com strict mode
  - Instalar dependências core (express, drizzle-orm, postgres, zod)
  - Criar estrutura de diretórios (src/, tests/, config/)
  - Configurar scripts no package.json (dev, build, test)
  - _Requirements: 4.1, 4.2_

- [x] 2. Configurar Docker Compose e PostgreSQL
  - Criar docker-compose.yml com serviço PostgreSQL
  - Configurar variáveis de ambiente (DATABASE_HOST, PORT, etc.)
  - Criar arquivo .env.example com variáveis necessárias
  - Testar inicialização do container PostgreSQL
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3. Configurar Drizzle ORM e schema do banco
  - [x] 3.1 Criar schema de tasks com Drizzle
    - Definir tabela tasks em src/db/schema.ts
    - Incluir campos: id, title, description, completed, createdAt, updatedAt
    - Configurar constraints (title NOT NULL, completed default false)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 3.2 Configurar conexão com banco de dados
    - Criar src/db/connection.ts com função de conexão
    - Implementar lógica de conexão usando variáveis de ambiente
    - Adicionar tratamento de erros de conexão
    - _Requirements: 2.1, 2.2, 3.3_
  
  - [x] 3.3 Configurar Drizzle Kit para migrações
    - Criar drizzle.config.ts
    - Gerar e aplicar migration inicial
    - _Requirements: 2.1_

- [x] 4. Implementar sistema de logging
  - [x] 4.1 Configurar logger (Winston ou Pino)
    - Criar src/config/logger.ts
    - Configurar níveis de log (info, warn, error, debug)
    - Configurar formato estruturado de logs
    - _Requirements: 5.1, 5.5_
  
  - [x] 4.2 Criar middleware de logging para requisições
    - Implementar middleware que loga todas as requisições HTTP
    - Incluir método, URL, status code, tempo de resposta
    - _Requirements: 5.2_

- [x] 5. Implementar validação de dados
  - Criar schemas Zod para CreateTaskRequest e UpdateTaskRequest
  - Implementar middleware de validação usando Zod
  - Validar: title obrigatório (1-255 chars), description opcional, completed boolean
  - Retornar 400 com detalhes de erro para dados inválidos
  - _Requirements: 4.6, 7.1, 8.2_

- [x] 6. Implementar Task Controller
  - [x] 6.1 Criar src/controllers/task.controller.ts
    - Implementar findAll(): buscar todas as tarefas
    - Implementar findById(id): buscar tarefa por ID
    - Implementar create(data): criar nova tarefa
    - Implementar update(id, data): atualizar tarefa existente
    - Implementar delete(id): deletar tarefa
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 6.2 Escrever testes unitários para Task Controller
    - Testar cada método com exemplos específicos
    - Testar casos de borda (ID inválido, dados vazios)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 7. Implementar rotas REST
  - [x] 7.1 Criar src/routes/task.routes.ts
    - GET /api/tasks - listar todas as tarefas
    - GET /api/tasks/:id - obter tarefa por ID
    - POST /api/tasks - criar nova tarefa
    - PUT /api/tasks/:id - atualizar tarefa
    - DELETE /api/tasks/:id - deletar tarefa
    - Aplicar middleware de validação nas rotas apropriadas
    - _Requirements: 4.3, 4.4_
  
  - [x] 7.2 Escrever testes de integração para rotas
    - Testar cada endpoint com requisições HTTP reais
    - Verificar status codes e estrutura de resposta
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 8. Implementar tratamento de erros
  - [x] 8.1 Criar middleware de tratamento de erros
    - Implementar src/middleware/errorHandler.ts
    - Capturar erros de validação (400)
    - Capturar erros de not found (404)
    - Capturar erros de servidor (500)
    - Formatar resposta de erro consistente
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 8.2 Adicionar logging de erros
    - Logar todos os erros antes de enviar resposta
    - Incluir stack trace para erros 500
    - _Requirements: 5.3, 7.5_
  
  - [x] 8.3 Implementar tratamento de erros de banco
    - Capturar erros de conexão do Drizzle
    - Capturar violações de constraints
    - Retornar mensagens apropriadas ao cliente
    - _Requirements: 2.4, 2.5_

- [x] 9. Configurar aplicação Express
  - Criar src/index.ts como entry point
  - Configurar middleware JSON parsing
  - Configurar middleware de logging
  - Registrar rotas de tasks
  - Registrar middleware de tratamento de erros
  - Inicializar conexão com banco na startup
  - Iniciar servidor na porta configurada
  - _Requirements: 4.1, 4.2_

- [x] 10. Checkpoint - Testar API manualmente
  - Iniciar docker-compose e aplicação
  - Testar cada endpoint CRUD manualmente
  - Verificar logs estão sendo gerados
  - Verificar erros retornam status codes corretos
  - Garantir que todos os testes passam, perguntar ao usuário se surgem dúvidas

- [x] 11. Implementar testes baseados em propriedades
  - [x] 11.1 Configurar fast-check
    - Instalar fast-check como dev dependency
    - Criar generators para dados de teste
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 11.2 Escrever property test para criação e recuperação
    - **Property 1: Task Creation Round Trip**
    - **Validates: Requirements 1.1, 1.3**
    - Gerar dados válidos de tarefa aleatórios
    - Criar tarefa via POST
    - Recuperar por ID via GET
    - Verificar dados equivalentes
    - Mínimo 100 iterações
  
  - [x] 11.3 Escrever property test para listagem completa
    - **Property 2: Task List Completeness**
    - **Validates: Requirements 1.2**
    - Criar N tarefas aleatórias
    - Listar todas via GET /api/tasks
    - Verificar count corresponde ao número criado
    - Mínimo 100 iterações
  
  - [x] 11.4 Escrever property test para atualização
    - **Property 3: Task Update Preserves Identity**
    - **Validates: Requirements 1.4**
    - Criar tarefa aleatória
    - Gerar dados de atualização aleatórios
    - Atualizar via PUT
    - Verificar ID e createdAt preservados
    - Verificar campos atualizados corretamente
    - Mínimo 100 iterações
  
  - [x] 11.5 Escrever property test para deleção
    - **Property 4: Task Deletion Removes Task**
    - **Validates: Requirements 1.5**
    - Criar tarefa aleatória
    - Deletar via DELETE
    - Tentar recuperar via GET
    - Verificar retorna 404
    - Mínimo 100 iterações
  
  - [x] 11.6 Escrever property test para IDs inválidos
    - **Property 5: Invalid ID Returns Error**
    - **Validates: Requirements 1.6**
    - Gerar IDs inválidos aleatórios (negativos, não-numéricos, não-existentes)
    - Tentar GET, PUT, DELETE com IDs inválidos
    - Verificar retorna erro apropriado (400 ou 404)
    - Mínimo 100 iterações
  
  - [x] 11.7 Escrever property test para validação de schema
    - **Property 6: Schema Validation Enforcement**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
    - Criar tarefas válidas aleatórias
    - Verificar title presente e não-vazio
    - Verificar completed é boolean
    - Verificar IDs são únicos
    - Verificar timestamps presentes
    - Mínimo 100 iterações
  
  - [x] 11.8 Escrever property test para rejeição de payloads inválidos
    - **Property 7: Invalid Payloads Rejected**
    - **Validates: Requirements 4.6, 7.1**
    - Gerar payloads inválidos aleatórios
    - Enviar via POST/PUT
    - Verificar retorna 400 com detalhes de erro
    - Mínimo 100 iterações
  
  - [x] 11.9 Escrever property test para status codes HTTP
    - **Property 9: Appropriate Status Codes**
    - **Validates: Requirements 4.5**
    - Testar operações bem-sucedidas (200, 201, 204)
    - Testar erros de validação (400)
    - Testar not found (404)
    - Verificar status codes corretos
    - Mínimo 100 iterações
  
  - [x] 11.10 Escrever property test para mensagens de erro
    - **Property 10: Error Responses Include Messages**
    - **Validates: Requirements 7.4**
    - Gerar vários tipos de erro
    - Verificar todas as respostas incluem mensagem descritiva
    - Mínimo 100 iterações
  
  - [x] 11.11 Escrever property test para logging de operações
    - **Property 13: Operations Are Logged**
    - **Validates: Requirements 5.2, 5.3, 5.4**
    - Executar operações aleatórias (CRUD, erros)
    - Verificar logs foram gerados
    - Verificar níveis de severidade corretos
    - Mínimo 100 iterações
  
  - [x] 11.12 Escrever property test para logging antes de resposta
    - **Property 14: Errors Logged Before Response**
    - **Validates: Requirements 7.5**
    - Gerar erros aleatórios
    - Verificar erro foi logado antes da resposta
    - Mínimo 100 iterações

- [x] 12. Configurar testes de carga com k6
  - [x] 12.1 Criar script k6 básico
    - Criar tests/load/k6-script.js
    - Configurar cenários: carga constante, rampa, stress
    - Testar todos os endpoints CRUD
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [x] 12.2 Adicionar validações no script k6
    - Verificar status codes corretos
    - Verificar estrutura de resposta
    - _Requirements: 6.5_
  
  - [x] 12.3 Configurar métricas e thresholds
    - Definir thresholds para response time (p95 < 200ms)
    - Definir threshold para error rate (< 1%)
    - Configurar relatório de métricas
    - _Requirements: 6.3_

- [x] 13. Documentação e finalização
  - Criar README.md com instruções de setup
  - Documentar variáveis de ambiente
  - Documentar endpoints da API
  - Adicionar exemplos de requisições
  - Criar script de inicialização rápida

- [x] 14. Checkpoint final - Validação completa
  - Executar todos os testes unitários
  - Executar todos os testes de propriedade
  - Executar testes de integração
  - Executar teste de carga k6
  - Verificar cobertura de código
  - Garantir que todos os testes passam, perguntar ao usuário se surgem dúvidas

## Notes

- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de correção
- Testes unitários validam exemplos específicos e casos de borda
- A implementação segue uma abordagem bottom-up: banco → controller → rotas → integração
