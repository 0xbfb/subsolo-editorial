
export const EDITORIAL_STATUSES = [
  'IDEIA',
  'TRIAGEM',
  'APROVADA',
  'PESQUISA',
  'EM_PRODUCAO',
  'AGUARDANDO_FONTE',
  'REVISAO_EDITORIAL',
  'REVISAO_FACTUAL',
  'AJUSTES',
  'PRONTO_PARA_PUBLICAR',
  'PR_CRIADO',
  'AGUARDANDO_MERGE',
  'PUBLICADO',
  'CORRECAO_PENDENTE',
  'ARQUIVADO',
  'RECUSADO',
] as const;

export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];

const transitions: Readonly<Record<EditorialStatus, readonly EditorialStatus[]>> = {
  IDEIA: ['TRIAGEM', 'ARQUIVADO', 'RECUSADO'],
  TRIAGEM: ['APROVADA', 'ARQUIVADO', 'RECUSADO'],
  APROVADA: ['PESQUISA', 'EM_PRODUCAO', 'ARQUIVADO'],
  PESQUISA: ['EM_PRODUCAO', 'AGUARDANDO_FONTE', 'ARQUIVADO'],
  EM_PRODUCAO: ['AGUARDANDO_FONTE', 'REVISAO_EDITORIAL', 'ARQUIVADO'],
  AGUARDANDO_FONTE: ['PESQUISA', 'EM_PRODUCAO', 'ARQUIVADO'],
  REVISAO_EDITORIAL: ['REVISAO_FACTUAL', 'AJUSTES', 'ARQUIVADO'],
  REVISAO_FACTUAL: ['AJUSTES', 'PRONTO_PARA_PUBLICAR', 'ARQUIVADO'],
  AJUSTES: ['EM_PRODUCAO', 'REVISAO_EDITORIAL', 'REVISAO_FACTUAL', 'ARQUIVADO'],
  PRONTO_PARA_PUBLICAR: ['PR_CRIADO', 'AJUSTES', 'ARQUIVADO'],
  PR_CRIADO: ['AGUARDANDO_MERGE', 'AJUSTES', 'ARQUIVADO'],
  AGUARDANDO_MERGE: ['PUBLICADO', 'AJUSTES', 'ARQUIVADO'],
  PUBLICADO: ['CORRECAO_PENDENTE', 'ARQUIVADO'],
  CORRECAO_PENDENTE: ['PRONTO_PARA_PUBLICAR', 'PUBLICADO', 'ARQUIVADO'],
  ARQUIVADO: ['TRIAGEM'],
  RECUSADO: ['TRIAGEM', 'ARQUIVADO'],
};

export type EditorialTransitionError = Readonly<{
  code: 'SUBSOLO_EDITORIAL_TRANSITION_INVALID';
  from: EditorialStatus;
  to: EditorialStatus;
  message: string;
}>;

export type EditorialTransitionResult =
  | Readonly<{ ok: true; value: EditorialStatus }>
  | Readonly<{ ok: false; error: EditorialTransitionError }>;

export const isEditorialStatus = (value: unknown): value is EditorialStatus =>
  typeof value === 'string' && EDITORIAL_STATUSES.some((status) => status === value);

export const allowedEditorialTransitions = (status: EditorialStatus): readonly EditorialStatus[] =>
  transitions[status];

export const canTransitionEditorialStatus = (
  from: EditorialStatus,
  to: EditorialStatus,
): boolean => transitions[from].includes(to);

export const transitionEditorialStatus = (
  from: EditorialStatus,
  to: EditorialStatus,
): EditorialTransitionResult => {
  if (canTransitionEditorialStatus(from, to)) {
    return { ok: true, value: to };
  }

  return {
    ok: false,
    error: {
      code: 'SUBSOLO_EDITORIAL_TRANSITION_INVALID',
      from,
      to,
      message: `Transição editorial inválida: ${from} → ${to}. Permitidas: ${transitions[from].join(', ') || 'nenhuma'}.`,
    },
  };
};

export const isPublicEditorialStatus = (status: EditorialStatus): boolean =>
  status === 'PUBLICADO' || status === 'CORRECAO_PENDENTE';
