const SECRET_KEY = /(?:authorization|access[_-]?token|refresh[_-]?token|password|secret|private[_-]?key|cookie|session|credential|encryption[_-]?key)/i;
const BODY_KEY = /^(?:body|content|article_body|document_text|editorial_text|raw_document|markdown)$/i;
const TOKEN_VALUE = /(?:Bearer\s+[A-Za-z0-9._~+\/-]+=*|ya29\.[A-Za-z0-9._-]+|gh[pousr]_[A-Za-z0-9_]+|-----BEGIN [A-Z ]*PRIVATE KEY-----)/gi;

const cleanString = (value) => String(value)
  .replace(TOKEN_VALUE, '[REDACTED_SECRET]')
  .replace(/[\r\n\t]+/g, ' ')
  .slice(0, 1000);

export const redactOperationalValue = (value, key = '') => {
  if (SECRET_KEY.test(key)) return '[REDACTED_SECRET]';
  if (BODY_KEY.test(key)) return '[REDACTED_EDITORIAL_BODY]';
  if (Array.isArray(value)) return value.map((entry) => redactOperationalValue(entry));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redactOperationalValue(childValue, childKey)]));
  }
  if (typeof value === 'string') return cleanString(value);
  return value;
};

export const classifyRetryable = ({ code = '', status = null, cause = '' } = {}) => {
  if ([408, 425, 429, 500, 502, 503, 504].includes(Number(status))) return true;
  return /(?:TIMEOUT|NETWORK|ECONNRESET|EAI_AGAIN|RATE_LIMIT|QUOTA|TEMPORARY|UNAVAILABLE|LOCKED)/i.test(`${code} ${cause}`);
};

export const createOperationalLogger = ({ service, sink = (entry) => process.stderr.write(`${JSON.stringify(entry)}\n`), clock = () => new Date(), runId = null } = {}) => {
  if (!service) throw new Error('SUBSOLO_LOGGER_SERVICE_REQUIRED');
  const emit = (level, event, context = {}) => {
    const entry = Object.freeze({
      timestamp: clock().toISOString(),
      level,
      service,
      event,
      ...(runId ? { run_id: runId } : {}),
      context: redactOperationalValue(context),
    });
    sink(entry);
    return entry;
  };
  return Object.freeze({
    debug: (event, context) => emit('debug', event, context),
    info: (event, context) => emit('info', event, context),
    warning: (event, context) => emit('warning', event, context),
    error: (event, context) => emit('error', event, context),
  });
};

export const createExecutionMetrics = ({ startedAt, finishedAt, status, artifacts = [], steps = [] }) => {
  const started = new Date(startedAt);
  const finished = new Date(finishedAt);
  if (Number.isNaN(started.valueOf()) || Number.isNaN(finished.valueOf()) || finished < started) throw new Error('SUBSOLO_METRICS_TIME_INVALID');
  const bytes = artifacts.reduce((sum, artifact) => sum + Number(artifact.bytes ?? 0), 0);
  return Object.freeze({
    status,
    duration_ms: finished.valueOf() - started.valueOf(),
    artifact_count: artifacts.length,
    artifact_bytes: bytes,
    completed_steps: steps.filter((step) => step.status === 'completed').length,
    failed_steps: steps.filter((step) => step.status === 'failed').length,
  });
};
