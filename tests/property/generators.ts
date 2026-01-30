import fc from 'fast-check';

/**
 * Generators para testes baseados em propriedades
 * 
 * Este arquivo contém generators do fast-check para gerar dados
 * de teste aleatórios mas válidos para a API de tarefas.
 * 
 * Os generators são usados nos testes de propriedade para validar
 * que as propriedades do sistema se mantêm verdadeiras para todas
 * as entradas possíveis.
 */

/**
 * Gera dados válidos para criação de tarefa
 * 
 * @returns Arbitrary que gera objetos com title, description e completed
 */
export const validTaskData = () => fc.record({
  title: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  completed: fc.option(fc.boolean(), { nil: undefined }),
});

/**
 * Gera dados inválidos para criação de tarefa
 * 
 * @returns Arbitrary que gera objetos com dados inválidos
 */
export const invalidTaskData = () => fc.oneof(
  // Title vazio
  fc.record({
    title: fc.constant(''),
    description: fc.option(fc.string()),
    completed: fc.option(fc.boolean()),
  }),
  // Title muito longo
  fc.record({
    title: fc.string({ minLength: 256, maxLength: 300 }),
    description: fc.option(fc.string()),
    completed: fc.option(fc.boolean()),
  }),
  // Title ausente
  fc.record({
    description: fc.option(fc.string()),
    completed: fc.option(fc.boolean()),
  }),
  // Completed não é boolean
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 255 }),
    description: fc.option(fc.string()),
    completed: fc.string() as any,
  }),
);

/**
 * Gera IDs de tarefa válidos (números positivos)
 * 
 * @returns Arbitrary que gera números inteiros positivos
 */
export const taskId = () => fc.integer({ min: 1, max: 1000000 });

/**
 * Gera IDs de tarefa inválidos
 * 
 * @returns Arbitrary que gera IDs inválidos (negativos, zero, não-numéricos)
 */
export const invalidTaskId = () => fc.oneof(
  fc.integer({ max: 0 }), // Negativos e zero
  fc.constant('abc' as any), // String não-numérica
  fc.constant(null as any), // Null
  fc.constant(undefined as any), // Undefined
  fc.double({ min: 1.1, max: 100.9 }) as any, // Números decimais
);

/**
 * Gera dados de atualização parcial de tarefa
 * 
 * @returns Arbitrary que gera objetos com campos opcionais para atualização
 */
export const updateData = () => fc.record({
  title: fc.option(fc.string({ minLength: 1, maxLength: 255 })),
  description: fc.option(fc.string({ maxLength: 1000 })),
  completed: fc.option(fc.boolean()),
}, { requiredKeys: [] });

/**
 * Gera uma lista de dados de tarefas válidas
 * 
 * @param minLength Número mínimo de tarefas
 * @param maxLength Número máximo de tarefas
 * @returns Arbitrary que gera array de dados de tarefas
 */
export const taskList = (minLength: number = 0, maxLength: number = 20) =>
  fc.array(validTaskData(), { minLength, maxLength });

/**
 * Gera métodos HTTP válidos
 * 
 * @returns Arbitrary que gera métodos HTTP
 */
export const httpMethod = () => fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

/**
 * Gera status codes HTTP
 * 
 * @returns Arbitrary que gera status codes comuns
 */
export const httpStatusCode = () => fc.constantFrom(200, 201, 204, 400, 404, 500);
