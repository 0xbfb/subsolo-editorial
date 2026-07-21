import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return fallback;
    throw e;
  }
};
const atomicWrite = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`);
  await rename(tmp, file);
};
export const createFilePitchRepository = ({ statePath }) => ({
  async list() {
    const value = await readJson(statePath, []);
    return Array.isArray(value) ? value : [];
  },
  async insert(pitch) {
    const rows = await this.list();
    if (rows.some((x) => x.source_fingerprint === pitch.source_fingerprint))
      return { inserted: false };
    rows.push(pitch);
    await atomicWrite(statePath, rows);
    return { inserted: true, pauta_id: pitch.pauta_id };
  },
});
export const createFileQuarantine = ({ directory }) => ({
  async record(item) {
    await mkdir(directory, { recursive: true });
    const safe = String(item.source_record_id)
      .replace(/[^a-z0-9_.-]/gi, '_')
      .slice(0, 80);
    const current = await readJson(path.join(directory, `${safe}.json`), []);
    current.push({ ...item, body_downloaded: false, opened: false });
    await atomicWrite(path.join(directory, `${safe}.json`), current);
  },
});
export const resetFileIngestionState = async ({ statePath, quarantineDirectory }) => {
  await rm(statePath, { force: true });
  await rm(quarantineDirectory, { recursive: true, force: true });
};
