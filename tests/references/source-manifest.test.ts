import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

 describe('manifesto das fontes', () => {
  it('preserva os artefatos auditados sem alteração', () => {
    const output = execFileSync(process.execPath, ['scripts/verify-source-manifest.mjs'], {
      encoding: 'utf8',
    });
    expect(output).toContain('fontes verificadas por SHA-256');
  });
});
