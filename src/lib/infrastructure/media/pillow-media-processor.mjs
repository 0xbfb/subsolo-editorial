import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { MediaFailure } from '../../domain/media-pipeline.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const defaultScript = resolve(here, '../../../../scripts/process-media.py');
const run = (
  args,
  {
    script = defaultScript,
    python = process.env.SUBSOLO_MEDIA_PYTHON ?? 'python3',
    timeoutMs = 120_000,
    input = null,
  } = {},
) =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(python, [script, ...args], {
      stdio: [input === null ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    if (input !== null) {
      child.stdin.end(JSON.stringify(input));
    }
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(
        new MediaFailure(
          'SUBSOLO_MEDIA_PROCESSOR_TIMEOUT',
          'O processador de mídia excedeu o tempo limite.',
          'Verifique o original e a instalação do Pillow.',
        ),
      );
    }, timeoutMs);
    child.stdout.on('data', (c) => (stdout += c));
    child.stderr.on('data', (c) => (stderr += c));
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(
        new MediaFailure(
          'SUBSOLO_MEDIA_PROCESSOR_UNAVAILABLE',
          'Não foi possível iniciar o processador Pillow.',
          'Instale Python e Pillow conforme requirements-media.txt.',
          { message: error.message },
        ),
      );
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0)
        return reject(
          new MediaFailure(
            'SUBSOLO_MEDIA_PROCESSOR_FAILED',
            'O processador de mídia rejeitou o arquivo.',
            'Consulte o erro e corrija a entrada.',
            { stderr: stderr.trim().slice(0, 1000) },
          ),
        );
      try {
        resolvePromise(JSON.parse(stdout));
      } catch (error) {
        reject(
          new MediaFailure(
            'SUBSOLO_MEDIA_PROCESSOR_OUTPUT_INVALID',
            'Saída inválida do processador.',
            'Revise scripts/process-media.py.',
            { stdout: stdout.slice(0, 500) },
          ),
        );
      }
    });
  });
export const createPillowMediaProcessor = (options = {}) =>
  Object.freeze({
    inspect: (source) => run(['inspect', '--source', source], options),
    inspectBatch: (sources) => run(['inspect-batch'], { ...options, input: { sources } }),
    process: ({ source, output, width, height, fit, format, focus }) =>
      run(
        [
          'process',
          '--source',
          source,
          '--output',
          output,
          '--width',
          String(width),
          '--height',
          String(height),
          '--fit',
          fit,
          '--format',
          format,
          '--focus-x',
          String(focus.x),
          '--focus-y',
          String(focus.y),
        ],
        options,
      ),
    processBatch: ({ source, items }) => run(['batch'], { ...options, input: { source, items } }),
    verify: (source) => run(['inspect', '--source', source], options),
  });
