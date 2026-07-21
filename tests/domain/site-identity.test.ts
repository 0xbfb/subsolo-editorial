import { describe, expect, it } from 'vitest';
import { getSiteIdentity } from '@application/get-site-identity';

describe('identidade do Subsolo', () => {
  it('mantém nome, slogan e fuso canônicos', () => {
    expect(getSiteIdentity()).toEqual({
      name: 'SUBSOLO',
      slogan: 'O ruído passa. O que importa fica.',
      timezone: 'America/Sao_Paulo',
    });
  });
});
