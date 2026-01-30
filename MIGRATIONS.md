# Guia de Migrações com Drizzle Kit

Este documento explica como gerenciar migrações de banco de dados usando o Drizzle Kit.

## Configuração

A configuração do Drizzle Kit está no arquivo `drizzle.config.ts` na raiz do projeto. Este arquivo define:

- **Dialeto**: PostgreSQL
- **Schema**: `./src/db/schema.ts` - onde os schemas são definidos
- **Diretório de migrações**: `./drizzle` - onde as migrações SQL são armazenadas
- **Credenciais**: Carregadas das variáveis de ambiente (arquivo `.env`)

## Comandos Disponíveis

### 1. Gerar Migration

Gera um arquivo SQL de migration baseado nas mudanças no schema:

```bash
npm run db:generate
```

Este comando:
- Compara o schema atual (`src/db/schema.ts`) com o estado do banco
- Gera um arquivo SQL em `drizzle/XXXX_nome_descritivo.sql`
- Cria metadados em `drizzle/meta/`

### 2. Aplicar Migration

Aplica as mudanças do schema diretamente ao banco de dados:

```bash
npm run db:push
```

Este comando:
- Lê o schema atual
- Compara com o estado do banco de dados
- Aplica as mudanças necessárias
- **Atenção**: Este comando é ideal para desenvolvimento, mas em produção considere usar migrations versionadas

### 3. Drizzle Studio

Abre uma interface visual para explorar e editar dados do banco:

```bash
npm run db:studio
```

Acesse em: `https://local.drizzle.studio`

## Fluxo de Trabalho

### Desenvolvimento Local

1. **Modificar o schema** em `src/db/schema.ts`
2. **Gerar migration**: `npm run db:generate`
3. **Revisar o SQL gerado** em `drizzle/XXXX_*.sql`
4. **Aplicar ao banco**: `npm run db:push`
5. **Verificar no banco**: Use `npm run db:studio` ou conecte via psql

### Exemplo: Adicionar um novo campo

```typescript
// src/db/schema.ts
export const tasks = pgTable('tasks', {
  // ... campos existentes
  priority: varchar('priority', { length: 20 }).default('medium').notNull()
});
```

Depois execute:
```bash
npm run db:generate  # Gera a migration
npm run db:push      # Aplica ao banco
```

## Verificação Manual

Para verificar a estrutura da tabela diretamente no PostgreSQL:

```bash
# Conectar ao container
docker compose exec postgres psql -U postgres -d todo_db

# Listar tabelas
\dt

# Descrever estrutura da tabela tasks
\d tasks

# Sair
\q
```

## Estrutura de Arquivos

```
drizzle/
├── meta/                           # Metadados das migrations
│   ├── _journal.json              # Histórico de migrations
│   └── 0000_snapshot.json         # Snapshot do schema
└── 0000_puzzling_star_brand.sql   # Migration inicial
```

## Migration Inicial

A migration inicial (`0000_puzzling_star_brand.sql`) cria a tabela `tasks` com:

- **id**: Serial (auto-incremento), chave primária
- **title**: VARCHAR(255), obrigatório
- **description**: TEXT, opcional
- **completed**: BOOLEAN, padrão false, obrigatório
- **created_at**: TIMESTAMP, padrão now(), obrigatório
- **updated_at**: TIMESTAMP, padrão now(), obrigatório

## Boas Práticas

1. **Sempre revise** o SQL gerado antes de aplicar
2. **Faça backup** do banco antes de aplicar migrations em produção
3. **Teste migrations** em ambiente de desenvolvimento primeiro
4. **Versione as migrations** no controle de versão (Git)
5. **Não edite** migrations já aplicadas - crie novas migrations para correções

## Troubleshooting

### Erro de conexão

Se houver erro ao conectar com o banco:

1. Verifique se o PostgreSQL está rodando: `docker compose ps`
2. Verifique as variáveis de ambiente no arquivo `.env`
3. Teste a conexão: `docker compose exec postgres psql -U postgres -d todo_db`

### Migration não aplicada

Se a migration não for aplicada:

1. Verifique se o arquivo `.env` está configurado corretamente
2. Verifique se o banco de dados existe
3. Execute `npm run db:push` novamente

### Resetar banco de dados

Para resetar completamente o banco (⚠️ **CUIDADO: apaga todos os dados**):

```bash
# Parar containers
docker compose down -v

# Iniciar novamente
docker compose up -d

# Aplicar migrations
npm run db:push
```

## Requisitos Atendidos

Esta configuração atende aos seguintes requisitos da spec:

- **Requisito 2.1**: Persistência de dados no PostgreSQL
- **Requisito 2.2**: Estabelecimento de conexão com o banco
- **Requisito 3.3**: Conexão com banco containerizado

## Referências

- [Documentação Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle ORM PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
