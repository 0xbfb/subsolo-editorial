
import { describe, expect, it } from 'vitest';
import {
  allowedEditorialTransitions,
  canTransitionEditorialStatus,
  transitionEditorialStatus,
} from '@domain/editorial-state';

describe('máquina de estados editorial', () => {
  it('permite o fluxo normal até publicação', () => {
    expect(canTransitionEditorialStatus('IDEIA', 'TRIAGEM')).toBe(true);
    expect(canTransitionEditorialStatus('REVISAO_FACTUAL', 'PRONTO_PARA_PUBLICAR')).toBe(true);
    expect(canTransitionEditorialStatus('AGUARDANDO_MERGE', 'PUBLICADO')).toBe(true);
  });

  it('rejeita salto direto de ideia para publicação', () => {
    const result = transitionEditorialStatus('IDEIA', 'PUBLICADO');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SUBSOLO_EDITORIAL_TRANSITION_INVALID');
      expect(result.error.message).toContain('IDEIA → PUBLICADO');
    }
  });

  it('declara as transições sem mutação externa', () => {
    expect(allowedEditorialTransitions('PRONTO_PARA_PUBLICAR')).toEqual([
      'PR_CRIADO',
      'AJUSTES',
      'ARQUIVADO',
    ]);
  });
});
