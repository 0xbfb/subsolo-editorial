export const EDITION_LIFECYCLE_STATES = ['planejada', 'aberta', 'publicada', 'selada'] as const;
export type EditionLifecycleState = (typeof EDITION_LIFECYCLE_STATES)[number];
export type EditionSlotState = 'confirmado' | 'reservado' | 'aberto';
export type EditionPublicationEntry = Readonly<{
  id: string;
  channel: string;
  date: string;
  path: string;
  position: number;
  featured: boolean;
  slot_state: EditionSlotState;
  public: boolean;
  carryover?: Readonly<{ allowed: true; reason: string }>;
}>;
export type EditionOperationalState = Readonly<{
  schema_version: '1.0.0';
  id: string;
  date: string;
  timezone: 'America/Sao_Paulo';
  lifecycle_state: EditionLifecycleState;
  revision: number;
  current_run_id: string | null;
  opened_at: string | null;
  published_at: string | null;
  sealed_at: string | null;
  publications: readonly EditionPublicationEntry[];
  private: Readonly<{
    map_day_id: string;
    slots: readonly unknown[];
    deferred: readonly unknown[];
    withdrawn: readonly unknown[];
  }>;
  history: readonly unknown[];
}>;
