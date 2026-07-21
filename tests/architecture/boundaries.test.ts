import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

 describe('fronteiras arquiteturais', () => {
  it('não possui dependências invertidas', () => {
    const output = execFileSync(process.execPath, ['scripts/check-boundaries.mjs'], {
      encoding: 'utf8',
    });
    expect(output).toContain('Fronteiras arquiteturais válidas.');
  });
});
