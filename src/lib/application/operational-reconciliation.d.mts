export interface OperationalSnapshot {
  sheets?: Array<Record<string, unknown>>;
  drive?: Array<Record<string, unknown>>;
  github?: Array<Record<string, unknown>>;
  deployments?: Array<Record<string, unknown>>;
  generated_at?: string;
}
export declare class ReconciliationFailure extends Error {
  code: string;
  action: string;
  details: Record<string, unknown>;
  toJSON(): Record<string, unknown>;
}
export declare const planOperationalReconciliation: (
  snapshot?: OperationalSnapshot,
) => Readonly<Record<string, unknown>>;
export declare const executeOperationalReconciliation: (input: {
  snapshot: OperationalSnapshot;
  mode?: 'dry-run' | 'apply';
}) => Record<string, unknown>;
