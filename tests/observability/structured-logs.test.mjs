import test from 'node:test';
import assert from 'node:assert/strict';
import {
  redactOperationalValue,
  classifyRetryable,
  createOperationalLogger,
  createExecutionMetrics,
} from '../../src/lib/application/operational-observability.mjs';
test('redacts secrets and editorial bodies recursively', () => {
  const value = redactOperationalValue({
    access_token: 'abc',
    nested: { body: 'conteúdo sensível', note: 'Bearer token.value' },
  });
  assert.equal(value.access_token, '[REDACTED_SECRET]');
  assert.equal(value.nested.body, '[REDACTED_EDITORIAL_BODY]');
  assert.match(value.nested.note, /REDACTED_SECRET/);
});
test('classifies only transient classes as retryable', () => {
  assert.equal(classifyRetryable({ status: 429 }), true);
  assert.equal(classifyRetryable({ code: 'SUBSOLO_TIMEOUT' }), true);
  assert.equal(classifyRetryable({ status: 403, code: 'ACCESS_DENIED' }), false);
});
test('logger emits single-line structured entries', () => {
  const entries = [];
  const logger = createOperationalLogger({
    service: 'test',
    sink: (entry) => entries.push(entry),
    clock: () => new Date('2026-07-20T12:00:00Z'),
  });
  logger.error('failed', { password: 'secret', body: 'article' });
  assert.equal(entries[0].timestamp, '2026-07-20T12:00:00.000Z');
  assert.equal(entries[0].context.password, '[REDACTED_SECRET]');
  assert.equal(entries[0].context.body, '[REDACTED_EDITORIAL_BODY]');
});
test('metrics record duration and artifact size', () => {
  const result = createExecutionMetrics({
    startedAt: '2026-07-20T10:00:00Z',
    finishedAt: '2026-07-20T10:00:02Z',
    status: 'ok',
    artifacts: [{ bytes: 40 }, { bytes: 2 }],
    steps: [{ status: 'completed' }, { status: 'failed' }],
  });
  assert.equal(result.duration_ms, 2000);
  assert.equal(result.artifact_bytes, 42);
  assert.equal(result.failed_steps, 1);
});
