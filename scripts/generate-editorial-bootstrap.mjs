import { readFile, writeFile, mkdir } from 'node:fs/promises';

const apply = process.argv.includes('--apply');
const workbook = JSON.parse(await readFile('templates/google/sheets/workbook.schema.json', 'utf8'));
const bootstrapDir = 'templates/google/sheets/bootstrap';

const escapeCsv = (value) => {
  const text =
    value == null
      ? ''
      : Array.isArray(value)
        ? value.join(';')
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const sourceByTab = {
  PAUTAS: 'fixtures/editorial/edition-2026-07-20/pitches.json',
  ARTIGOS: 'fixtures/editorial/edition-2026-07-20/articles.json',
  EDICOES: 'fixtures/editorial/edition-2026-07-20/edition.json',
  AUTORES: 'src/data/editorial/catalogs/authors.json',
  CANAIS: 'src/data/editorial/catalogs/channels.json',
  QUADROS: 'src/data/editorial/catalogs/frames.json',
  TEMAS: 'src/data/editorial/catalogs/topics.json',
  FONTES: 'fixtures/editorial/edition-2026-07-20/sources.json',
  PUBLICACOES: 'fixtures/editorial/edition-2026-07-20/publications.json',
  CORRECOES: 'fixtures/editorial/edition-2026-07-20/corrections.json',
  AUTOMACOES: 'fixtures/editorial/edition-2026-07-20/automations.json',
  CONFIGURACOES: 'fixtures/editorial/edition-2026-07-20/configurations.json',
};

const plan = [];
for (const [tab, columns] of Object.entries(workbook.tabs)) {
  const source = sourceByTab[tab];
  const parsed = JSON.parse(await readFile(source, 'utf8'));
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const headers = columns.map((column) => column.name);
  const csv =
    [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
    ].join('\n') + '\n';
  plan.push({
    tab,
    source,
    csvPath: `${bootstrapDir}/${tab}.csv`,
    jsonPath: `${bootstrapDir}/${tab}.json`,
    rows: rows.length,
    csv,
    json: JSON.stringify(rows, null, 2) + '\n',
  });
}

console.log(
  JSON.stringify(
    {
      mode: apply ? 'apply' : 'dry-run',
      files: plan.map(({ tab, source, csvPath, jsonPath, rows }) => ({
        tab,
        source,
        csvPath,
        jsonPath,
        rows,
      })),
    },
    null,
    2,
  ),
);

if (apply) {
  await mkdir(bootstrapDir, { recursive: true });
  for (const item of plan) {
    await writeFile(item.csvPath, item.csv, 'utf8');
    await writeFile(item.jsonPath, item.json, 'utf8');
  }
}
