import { describe, expect, it } from 'vitest';
import { readRuntimeConfig } from '@infrastructure/runtime-config';

 describe('configuração de runtime', () => {
  it('usa valores seguros de desenvolvimento', () => {
    expect(readRuntimeConfig({})).toEqual({
      timezone: 'America/Sao_Paulo',
      siteUrl: 'http://localhost:4321',
    });
  });

  it('respeita configuração explícita', () => {
    expect(readRuntimeConfig({ SUBSOLO_SITE_URL: 'https://subsolo.example' }).siteUrl).toBe(
      'https://subsolo.example',
    );
  });
});
