export type OperationalLogLevel = 'debug' | 'info' | 'warning' | 'error';
export interface OperationalLogEntry { timestamp: string; level: OperationalLogLevel; service: string; event: string; run_id?: string; context: Record<string, unknown>; }
export declare const redactOperationalValue: (value: unknown, key?: string) => unknown;
export declare const classifyRetryable: (input?: { code?: string; status?: number | null; cause?: string }) => boolean;
export declare const createOperationalLogger: (input: { service: string; sink?: (entry: OperationalLogEntry) => void; clock?: () => Date; runId?: string | null }) => { debug(event: string, context?: Record<string, unknown>): OperationalLogEntry; info(event: string, context?: Record<string, unknown>): OperationalLogEntry; warning(event: string, context?: Record<string, unknown>): OperationalLogEntry; error(event: string, context?: Record<string, unknown>): OperationalLogEntry; };
export declare const createExecutionMetrics: (input: { startedAt: string; finishedAt: string; status: string; artifacts?: Array<{ bytes?: number }>; steps?: Array<{ status: string }> }) => Readonly<Record<string, number | string>>;
