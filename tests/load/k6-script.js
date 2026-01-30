import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * Script de teste de carga k6 para Todo API
 * 
 * Este script testa todos os endpoints CRUD da API sob diferentes
 * cenários de carga para validar performance e estabilidade.
 * 
 * Cenários:
 * - Carga constante: 10 usuários por 30 segundos
 * - Rampa de carga: 0 → 50 usuários em 1 minuto
 * - Stress test: 100 usuários por 2 minutos
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

// Métricas customizadas
const errorRate = new Rate('errors');
const taskCreationTime = new Trend('task_creation_time');
const taskRetrievalTime = new Trend('task_retrieval_time');
const taskUpdateTime = new Trend('task_update_time');
const taskDeletionTime = new Trend('task_deletion_time');

// Configuração dos cenários de teste
export const options = {
  scenarios: {
    // Cenário 1: Carga constante
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      tags: { scenario: 'constant' },
    },
    // Cenário 2: Rampa de carga
    ramp_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },
        { duration: '30s', target: 50 },
      ],
      tags: { scenario: 'ramp' },
      startTime: '35s', // Inicia após o cenário anterior
    },
    // Cenário 3: Stress test
    stress_test: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2m',
      tags: { scenario: 'stress' },
      startTime: '1m10s', // Inicia após os cenários anteriores
    },
  },
  // Thresholds para validação de performance
  thresholds: {
    // Taxa de erro deve ser menor que 1%
    'errors': ['rate<0.01'],
    // 95% das requisições devem responder em menos de 200ms
    'http_req_duration': ['p(95)<200'],
    // 99% das requisições devem responder em menos de 500ms
    'http_req_duration': ['p(99)<500'],
    // Taxa de requisições bem-sucedidas deve ser maior que 99%
    'http_req_failed': ['rate<0.01'],
  },
};

// URL base da API
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

/**
 * Função principal de teste
 * Executa um fluxo completo de operações CRUD
 */
export default function () {
  // Grupo: Criar tarefa
  group('Create Task', () => {
    const createPayload = JSON.stringify({
      title: `Task ${Date.now()}-${__VU}-${__ITER}`,
      description: `Test task created by k6 VU ${__VU} iteration ${__ITER}`,
      completed: false,
    });

    const createParams = {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { operation: 'create' },
    };

    const createResponse = http.post(
      `${BASE_URL}/api/tasks`,
      createPayload,
      createParams
    );

    // Validações
    const createSuccess = check(createResponse, {
      'create: status is 201': (r) => r.status === 201,
      'create: has id': (r) => JSON.parse(r.body).id !== undefined,
      'create: has title': (r) => JSON.parse(r.body).title !== undefined,
      'create: has completed': (r) => JSON.parse(r.body).completed !== undefined,
      'create: has timestamps': (r) => {
        const body = JSON.parse(r.body);
        return body.createdAt !== undefined && body.updatedAt !== undefined;
      },
    });

    errorRate.add(!createSuccess);
    taskCreationTime.add(createResponse.timings.duration);

    if (!createSuccess) {
      console.error(`Create failed: ${createResponse.status} - ${createResponse.body}`);
      return;
    }

    const taskId = JSON.parse(createResponse.body).id;

    // Pequena pausa entre operações
    sleep(0.1);

    // Grupo: Listar todas as tarefas
    group('List Tasks', () => {
      const listResponse = http.get(`${BASE_URL}/api/tasks`, {
        tags: { operation: 'list' },
      });

      const listSuccess = check(listResponse, {
        'list: status is 200': (r) => r.status === 200,
        'list: has tasks array': (r) => Array.isArray(JSON.parse(r.body).tasks),
        'list: has count': (r) => JSON.parse(r.body).count !== undefined,
      });

      errorRate.add(!listSuccess);
    });

    sleep(0.1);

    // Grupo: Recuperar tarefa específica
    group('Get Task', () => {
      const getResponse = http.get(`${BASE_URL}/api/tasks/${taskId}`, {
        tags: { operation: 'get' },
      });

      const getSuccess = check(getResponse, {
        'get: status is 200': (r) => r.status === 200,
        'get: correct id': (r) => JSON.parse(r.body).id === taskId,
        'get: has all fields': (r) => {
          const body = JSON.parse(r.body);
          return body.title && body.completed !== undefined && body.createdAt && body.updatedAt;
        },
      });

      errorRate.add(!getSuccess);
      taskRetrievalTime.add(getResponse.timings.duration);
    });

    sleep(0.1);

    // Grupo: Atualizar tarefa
    group('Update Task', () => {
      const updatePayload = JSON.stringify({
        title: `Updated Task ${Date.now()}`,
        completed: true,
      });

      const updateParams = {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { operation: 'update' },
      };

      const updateResponse = http.put(
        `${BASE_URL}/api/tasks/${taskId}`,
        updatePayload,
        updateParams
      );

      const updateSuccess = check(updateResponse, {
        'update: status is 200': (r) => r.status === 200,
        'update: id preserved': (r) => JSON.parse(r.body).id === taskId,
        'update: completed is true': (r) => JSON.parse(r.body).completed === true,
        'update: updatedAt changed': (r) => {
          const body = JSON.parse(r.body);
          return new Date(body.updatedAt) >= new Date(body.createdAt);
        },
      });

      errorRate.add(!updateSuccess);
      taskUpdateTime.add(updateResponse.timings.duration);
    });

    sleep(0.1);

    // Grupo: Deletar tarefa
    group('Delete Task', () => {
      const deleteResponse = http.del(`${BASE_URL}/api/tasks/${taskId}`, {
        tags: { operation: 'delete' },
      });

      const deleteSuccess = check(deleteResponse, {
        'delete: status is 204': (r) => r.status === 204,
      });

      errorRate.add(!deleteSuccess);
      taskDeletionTime.add(deleteResponse.timings.duration);

      // Verifica que a tarefa foi realmente deletada
      const verifyResponse = http.get(`${BASE_URL}/api/tasks/${taskId}`, {
        tags: { operation: 'verify_delete' },
      });

      const verifySuccess = check(verifyResponse, {
        'delete: task not found after deletion': (r) => r.status === 404,
      });

      errorRate.add(!verifySuccess);
    });
  });

  // Pausa entre iterações
  sleep(1);
}

/**
 * Função de setup
 * Executada uma vez antes de todos os testes
 */
export function setup() {
  console.log('🚀 Iniciando testes de carga k6');
  console.log(`📍 URL base: ${BASE_URL}`);
  console.log('⏱️  Duração total estimada: ~3 minutos');
  
  // Verifica se a API está acessível
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API não está acessível: ${healthCheck.status}`);
  }
  
  console.log('✅ API está acessível e pronta para testes');
  return { startTime: Date.now() };
}

/**
 * Função de teardown
 * Executada uma vez após todos os testes
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n✅ Testes de carga concluídos em ${duration.toFixed(2)}s`);
}

/**
 * Função de tratamento de resumo
 * Customiza o relatório final
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'tests/load/k6-results.json': JSON.stringify(data),
  };
}

// Função auxiliar para criar resumo de texto
function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}📊 Resumo dos Testes de Carga\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;
  
  // Estatísticas gerais
  summary += `${indent}Requisições totais: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Taxa de erro: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}Duração média: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  
  // Métricas por operação
  summary += `${indent}Tempos por operação:\n`;
  summary += `${indent}  - Criação: ${data.metrics.task_creation_time.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  - Recuperação: ${data.metrics.task_retrieval_time.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  - Atualização: ${data.metrics.task_update_time.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  - Deleção: ${data.metrics.task_deletion_time.values.avg.toFixed(2)}ms\n`;
  
  return summary;
}
