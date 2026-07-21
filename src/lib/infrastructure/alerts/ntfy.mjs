import {
  classifyRetryable,
  redactOperationalValue,
} from '../../application/operational-observability.mjs';

export class NtfyFailure extends Error {
  constructor(code, message, action, retryable = false, details = {}) {
    super(message);
    this.name = 'NtfyFailure';
    this.code = code;
    this.action = action;
    this.retryable = retryable;
    this.details = details;
  }
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      action: this.action,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

const priorityFor = (severity) =>
  ({ info: '3', warning: '4', error: '5', critical: '5' })[severity] ?? '3';
const tagsFor = (severity) =>
  ({
    info: 'information_source',
    warning: 'warning',
    error: 'rotating_light',
    critical: 'rotating_light',
  })[severity] ?? 'information_source';

export const createNtfyNotifier = ({
  baseUrl,
  topic,
  token = null,
  fetchImpl = globalThis.fetch,
  timeoutMs = 8000,
  logger = null,
} = {}) => {
  if (!/^https?:\/\//.test(baseUrl ?? ''))
    throw new NtfyFailure(
      'SUBSOLO_NTFY_URL_INVALID',
      'URL do ntfy inválida.',
      'Configure SUBSOLO_NTFY_URL com HTTP ou HTTPS.',
    );
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(topic ?? ''))
    throw new NtfyFailure(
      'SUBSOLO_NTFY_TOPIC_INVALID',
      'Tópico do ntfy inválido.',
      'Use um tópico alfanumérico não previsível.',
    );
  return Object.freeze({
    async send({
      severity = 'info',
      code,
      action,
      message = null,
      run_id = null,
      component = 'subsolo',
    }) {
      if (!code || !action)
        throw new NtfyFailure(
          'SUBSOLO_NTFY_ALERT_INVALID',
          'Alerta sem código ou ação.',
          'Forneça code e action.',
        );
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const safe = redactOperationalValue({ code, action, message, run_id, component });
      const body = [
        safe.code,
        safe.message,
        `Ação: ${safe.action}`,
        safe.run_id ? `Run: ${safe.run_id}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      try {
        const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/${topic}`, {
          method: 'POST',
          signal: controller.signal,
          body,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            Title: `SUBSOLO · ${component}`,
            Priority: priorityFor(severity),
            Tags: tagsFor(severity),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok)
          throw new NtfyFailure(
            'SUBSOLO_NTFY_HTTP_FAILED',
            `ntfy respondeu HTTP ${response.status}.`,
            'Verifique serviço, autenticação e tópico.',
            classifyRetryable({ status: response.status }),
            { status: response.status },
          );
        logger?.info?.('ntfy.alert.sent', { severity, code, run_id });
        return { sent: true, status: response.status, severity, code };
      } catch (error) {
        if (error instanceof NtfyFailure) throw error;
        const timeout = error?.name === 'AbortError';
        throw new NtfyFailure(
          timeout ? 'SUBSOLO_NTFY_TIMEOUT' : 'SUBSOLO_NTFY_NETWORK_FAILED',
          timeout ? 'O envio ao ntfy excedeu o timeout.' : 'Falha de rede ao enviar alerta.',
          'Verifique o serviço e repita o alerta.',
          true,
        );
      } finally {
        clearTimeout(timer);
      }
    },
  });
};
