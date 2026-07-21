#!/usr/bin/env node
import {
  planExport,
  applyExport,
  planExportFromInput,
  applyExportFromInput,
  ExportFailure,
} from './exporter-core.mjs';

const args = process.argv.slice(2);
const value = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const has = (flag) => args.includes(flag);
const usage = () => `Uso:
  Empacotamento:
    node cli/subsolo.mjs package --workspace <dir> --destination <dir|zip> --dry-run [--previous-package <zip>]
    node cli/subsolo.mjs package --workspace <dir> --destination <dir|zip> --apply [--previous-package <zip>]

  Restauração:
    node cli/subsolo.mjs restore --package <zip> --destination <dir> --dry-run
    node cli/subsolo.mjs restore --package <zip> --destination <dir> --apply [--overwrite]
    node cli/subsolo.mjs validate-package --package <zip>

  Fixture offline:
    node cli/subsolo.mjs export-doc --provider fixture --sheet <row.json> --document <doc.json> --destination <dir> --dry-run
    node cli/subsolo.mjs export-doc --provider fixture --sheet <row.json> --document <doc.json> --destination <dir> --apply [--overwrite]

  Google somente leitura:
    node cli/subsolo.mjs export-doc --provider google --article-id <id> --spreadsheet-id <id> --sheet-range 'ARTIGOS!A:AZ' --destination <dir> --dry-run
    node cli/subsolo.mjs export-doc --provider google --article-id <id> [--document-id <id>] [--tab-id <id>] --destination <dir> --apply [--overwrite]

  Preservação técnica no Google Drive:
    node cli/subsolo.mjs publish --package <zip> --skip-git --drive-root-id <id> --dry-run [--receipt <json>]
    node cli/subsolo.mjs publish --package <zip> --skip-git --drive-root-id <id> --apply [--receipt <json>]

  Orquestração n8n/fixture:
    node cli/subsolo.mjs orchestrate --input <candidate.json> --dry-run|--apply
    node cli/subsolo.mjs reconcile --input <candidate-or-operational-snapshot.json> --dry-run|--apply

  Ciclo da edição diária:
    node cli/subsolo.mjs edition --command <open|append|publish|revise|seal|correct> --state <json> [--payload <json>] --output <json> --dry-run|--apply

  Pós-publicação:
    node cli/subsolo.mjs post-publication --state <json> --payload <json> --output <json> --dry-run|--apply

  Processamento de mídia:
    node cli/subsolo.mjs media --manifest <json> --destination <dir> --dry-run
    node cli/subsolo.mjs media --manifest <json> --destination <dir> --apply [--overwrite]

  Captação editorial:
    node cli/subsolo.mjs ingest --source <freshrss|gmail|searxng> --provider fixture --input <json> --state <json> --output <dir> --dry-run|--apply
    node cli/subsolo.mjs ingest --source <freshrss|gmail|searxng> --provider live --state <json> --output <dir> [--query <texto>|--query-file <json>] [--spreadsheet-id <id>] --dry-run|--apply

Credenciais:
  GOOGLE_WORKSPACE_ACCESS_TOKEN=<token efêmero>
  ou SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE=/caminho/fora/do/repositorio.json

Drive:
  SUBSOLO_DRIVE_ROOT_FOLDER_ID=<id da pasta SUBSOLO>
  GOOGLE_DRIVE_ACCESS_TOKEN=<token efêmero opcional>
`;

const requiredValue = (flag, code = 'SUBSOLO_CLI_ARGUMENT_MISSING') => {
  const result = value(flag);
  if (!result) throw new ExportFailure(code, `Argumento obrigatório ausente: ${flag}.`, `Informe ${flag}.`);
  return result;
};

const structuredStderr = (entry) => process.stderr.write(`${JSON.stringify(entry)}\n`);

try {
  if (has('--help')) {
    console.log(usage());
  } else {
    const command = args[0];
    if (command === 'package') {
      const { planPackage, applyPackage } = await import('./packager-core.mjs');
      const workspace = requiredValue('--workspace', 'SUBSOLO_PACKAGE_ARGUMENT_MISSING');
      const destination = requiredValue('--destination', 'SUBSOLO_PACKAGE_ARGUMENT_MISSING');
      if (has('--dry-run') === has('--apply')) {
        throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID', 'Escolha exatamente um modo.', 'Use --dry-run ou --apply.');
      }
      const options = { workspace, destination, previousPackage: value('--previous-package') ?? null };
      const result = has('--dry-run') ? await planPackage(options) : await applyPackage(options);
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'restore') {
      const { planRestore, applyRestore } = await import('./packager-core.mjs');
      const packagePath = requiredValue('--package', 'SUBSOLO_RESTORE_ARGUMENT_MISSING');
      const destination = requiredValue('--destination', 'SUBSOLO_RESTORE_ARGUMENT_MISSING');
      if (has('--dry-run') === has('--apply')) {
        throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID', 'Escolha exatamente um modo.', 'Use --dry-run ou --apply.');
      }
      const result = has('--dry-run')
        ? await planRestore({ packagePath, destination })
        : await applyRestore({ packagePath, destination, overwrite: has('--overwrite') });
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'validate-package') {
      const { validatePackageFile } = await import('./packager-core.mjs');
      console.log(JSON.stringify(await validatePackageFile(requiredValue('--package')), null, 2));
    } else if (command === 'publish') {
      if (!has('--skip-git')) {
        throw new ExportFailure('SUBSOLO_PUBLISH_GIT_SCOPE_INVALID', 'O Prompt 11 permite somente preservação no Drive.', 'Adicione --skip-git; branch e PR pertencem ao Prompt 12.');
      }
      if (has('--dry-run') === has('--apply')) {
        throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID', 'Escolha exatamente um modo.', 'Use --dry-run ou --apply.');
      }
      const packagePath = requiredValue('--package', 'SUBSOLO_ARCHIVE_ARGUMENT_MISSING');
      const rootFolderId = value('--drive-root-id') ?? process.env.SUBSOLO_DRIVE_ROOT_FOLDER_ID;
      if (!rootFolderId) {
        throw new ExportFailure('SUBSOLO_ARCHIVE_ROOT_ID_MISSING', 'A pasta raiz do Drive não foi configurada.', 'Informe --drive-root-id ou SUBSOLO_DRIVE_ROOT_FOLDER_ID.');
      }
      const { planPackageArchive, applyPackageArchive } = await import('../src/lib/application/archive-edition-package.mjs');
      const { createGoogleDriveArchiveAdapter, createGoogleDriveTokenProvider } = await import('../src/lib/infrastructure/google/google-drive.mjs');
      const { createStructuredLogger } = await import('../src/lib/infrastructure/google/google-workspace.mjs');
      const logger = createStructuredLogger({ sink: structuredStderr, verbose: has('--verbose') });
      const tokenProvider = createGoogleDriveTokenProvider({ logger });
      const adapter = createGoogleDriveArchiveAdapter({
        tokenProvider,
        logger,
        timeoutMs: Number(value('--timeout-ms') ?? process.env.SUBSOLO_GOOGLE_DRIVE_TIMEOUT_MS ?? 20_000),
        maxAttempts: Number(value('--max-attempts') ?? process.env.SUBSOLO_GOOGLE_DRIVE_MAX_ATTEMPTS ?? 4),
        chunkSize: Number(value('--chunk-size') ?? process.env.SUBSOLO_GOOGLE_DRIVE_CHUNK_SIZE ?? 2_097_152),
      });
      const options = { packagePath, rootFolderId, receiptPath: value('--receipt') ?? null, adapter };
      const result = has('--dry-run') ? await planPackageArchive(options) : await applyPackageArchive(options);
      console.log(JSON.stringify({ ...result, git: 'skipped' }, null, 2));
    } else if (command === 'edition') {
      const { readFile, writeFile, mkdir } = await import('node:fs/promises');
      const path = await import('node:path');
      const statePath = requiredValue('--state', 'SUBSOLO_EDITION_STATE_MISSING');
      const editionCommand = requiredValue('--command', 'SUBSOLO_EDITION_COMMAND_MISSING');
      const output = requiredValue('--output', 'SUBSOLO_EDITION_OUTPUT_MISSING');
      if (has('--dry-run') === has('--apply')) throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID','Escolha exatamente um modo.','Use --dry-run ou --apply.');
      const state = JSON.parse(await readFile(statePath,'utf8'));
      const payload = value('--payload') ? JSON.parse(await readFile(value('--payload'),'utf8')) : {};
      const { executeEditionCommand, toPublicEdition } = await import('../src/lib/application/edition-lifecycle.mjs');
      const next = executeEditionCommand({state,command:editionCommand,payload});
      const result = {mode:has('--dry-run')?'dry-run':'apply',command:editionCommand,state:next,public:next.revision>0?toPublicEdition(next):null,output:path.resolve(output)};
      if (has('--apply')) { await mkdir(path.dirname(path.resolve(output)),{recursive:true}); await writeFile(output,`${JSON.stringify(next,null,2)}\n`); }
      if (['publish','revise','seal','correct'].includes(editionCommand) && value('--package-workspace') && value('--package-destination')) {
        const { packageLifecycleRevision } = await import('../src/lib/application/edition-lifecycle-package.mjs');
        result.package = await packageLifecycleRevision({state:next,workspaceTemplate:value('--package-workspace'),destination:value('--package-destination'),previousPackage:value('--previous-package')??null,mode:has('--apply')?'apply':'dry-run'});
      }
      console.log(JSON.stringify(result,null,2));
    } else if (command === 'orchestrate' || command === 'reconcile') {
      const { readFile } = await import('node:fs/promises');
      const input = JSON.parse(await readFile(requiredValue('--input', 'SUBSOLO_ORCHESTRATION_INPUT_MISSING'), 'utf8'));
      if (has('--dry-run') === has('--apply')) throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID','Escolha exatamente um modo.','Use --dry-run ou --apply.');
      const mode = has('--dry-run') ? 'dry-run' : 'apply';
      let result;
      if (command === 'reconcile' && input.kind === 'operational-reconciliation') {
        const { executeOperationalReconciliation } = await import('../src/lib/application/operational-reconciliation.mjs');
        result = executeOperationalReconciliation({ snapshot: input, mode });
      } else {
        const { createFixtureOrchestrationPorts } = await import('../src/lib/infrastructure/orchestration/fixture-ports.mjs');
        const { executePublicationRun, reconcilePublication } = await import('../src/lib/application/publication-orchestrator.mjs');
        const fixture = createFixtureOrchestrationPorts({ candidate: input });
        result = command === 'orchestrate'
          ? await executePublicationRun({ candidate: input, ports: fixture.ports, mode })
          : await reconcilePublication({ candidate: input, ports: fixture.ports, mode });
      }
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'post-publication') {
      const { readFile, writeFile, mkdir, rename, rm } = await import('node:fs/promises');
      const path = await import('node:path');
      if (has('--dry-run') === has('--apply')) throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID','Escolha exatamente um modo.','Use --dry-run ou --apply.');
      const statePath = requiredValue('--state', 'SUBSOLO_POST_PUBLICATION_STATE_MISSING');
      const payloadPath = requiredValue('--payload', 'SUBSOLO_POST_PUBLICATION_PAYLOAD_MISSING');
      const outputPath = requiredValue('--output', 'SUBSOLO_POST_PUBLICATION_OUTPUT_MISSING');
      const [state, payload] = await Promise.all([
        readFile(statePath, 'utf8').then(JSON.parse),
        readFile(payloadPath, 'utf8').then(JSON.parse),
      ]);
      const { planPostPublicationChange, applyPostPublicationChange } = await import('../src/lib/domain/post-publication.mjs');
      if (has('--dry-run')) {
        console.log(JSON.stringify(planPostPublicationChange({ state, payload }), null, 2));
      } else {
        const result = applyPostPublicationChange({ state, payload });
        const target = path.resolve(outputPath);
        await mkdir(path.dirname(target), { recursive: true });
        const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
        try {
          await writeFile(temporary, `${JSON.stringify(result, null, 2)}\n`);
          await rename(temporary, target);
        } catch (error) {
          await rm(temporary, { force: true });
          throw error;
        }
        console.log(JSON.stringify({ mode: 'apply', output: target, publication_id: result.publication_id, revision: result.revision, status: result.status, canonical_path: result.canonical_path }, null, 2));
      }
    } else if (command === 'ingest') {
      const { readFile, writeFile, mkdir } = await import('node:fs/promises');
      const path = await import('node:path');
      const source = requiredValue('--source', 'SUBSOLO_INGEST_SOURCE_MISSING');
      const provider = value('--provider') ?? 'fixture';
      const output = requiredValue('--output', 'SUBSOLO_INGEST_OUTPUT_MISSING');
      const statePath = value('--state') ?? process.env.SUBSOLO_INGESTION_STATE ?? '.runtime/editorial/pitches.json';
      if (has('--dry-run') === has('--apply')) throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID','Escolha exatamente um modo.','Use --dry-run ou --apply.');
      const mode = has('--dry-run') ? 'dry-run' : 'apply';
      const readOptionalJson = async (file, fallback = {}) => file ? JSON.parse(await readFile(file, 'utf8')) : fallback;
      const policy = await readOptionalJson(value('--policy') ?? process.env.SUBSOLO_INGESTION_POLICY_FILE, {});
      const config = {
        trustedSenders: policy.trusted_senders ?? String(process.env.SUBSOLO_GMAIL_TRUSTED_SENDERS ?? '').split(',').map(x=>x.trim()).filter(Boolean),
        trustedDomains: policy.trusted_domains ?? String(process.env.SUBSOLO_GMAIL_TRUSTED_DOMAINS ?? '').split(',').map(x=>x.trim()).filter(Boolean),
        duplicateThreshold: Number(policy.duplicate_threshold ?? 0.82),
      };
      let entries = []; let sourceMeta = {};
      if (provider === 'fixture') {
        const input = await readOptionalJson(requiredValue('--input', 'SUBSOLO_INGEST_INPUT_MISSING'));
        entries = source === 'freshrss' ? input.items ?? [] : source === 'gmail' ? input.messages ?? [] : input.results ?? [];
        sourceMeta = source === 'searxng' ? { partial: Boolean(input.unresponsive_engines?.length), failedEngines: (input.unresponsive_engines ?? []).map(x=>Array.isArray(x)?x[0]:String(x)), query: input.query ?? '' } : {};
      } else if (provider === 'live') {
        const { createFreshRssClient, createGmailIngestionClient, createSearxngClient } = await import('../src/lib/infrastructure/ingestion/source-clients.mjs');
        if (source === 'freshrss') {
          const client = createFreshRssClient({ baseUrl: process.env.SUBSOLO_FRESHRSS_API_URL, username: process.env.SUBSOLO_FRESHRSS_API_USER, apiPassword: process.env.SUBSOLO_FRESHRSS_API_PASSWORD, authToken: process.env.SUBSOLO_FRESHRSS_AUTH_TOKEN, timeoutMs: Number(value('--timeout-ms') ?? 10_000) });
          const result = await client.listReadingList({ limit: Number(value('--limit') ?? 100) }); entries = result.entries;
        } else if (source === 'gmail') {
          const client = createGmailIngestionClient({ accessToken: process.env.SUBSOLO_GMAIL_READONLY_TOKEN, timeoutMs: Number(value('--timeout-ms') ?? 10_000) });
          const list = await client.listMessages({ query: value('--query') ?? process.env.SUBSOLO_GMAIL_QUERY ?? 'label:SUBSOLO/Pautas newer_than:2d', maxResults: Number(value('--limit') ?? 100) });
          entries = await Promise.all((list.messages ?? []).map(item => client.getMessage(item.id)));
        } else if (source === 'searxng') {
          const client = createSearxngClient({ baseUrl: process.env.SUBSOLO_SEARXNG_URL ?? 'http://127.0.0.1:8081', timeoutMs: Number(value('--timeout-ms') ?? 10_000) });
          const queryFile = value('--query-file');
          const queryPayload = queryFile ? await readOptionalJson(queryFile, {}) : {};
          const query = value('--query') ?? queryPayload.query;
          if (!query?.trim()) throw new ExportFailure('SUBSOLO_INGEST_SEARXNG_QUERY_MISSING','Consulta SearXNG ausente.','Informe --query ou um JSON seguro em --query-file.');
          const result = await client.search({ query, categories: value('--categories') ?? queryPayload.categories ?? '', language: value('--language') ?? queryPayload.language ?? 'pt-BR', timeRange: value('--time-range') ?? queryPayload.time_range ?? null }); entries = result.entries; sourceMeta = result;
        } else throw new ExportFailure('SUBSOLO_INGEST_SOURCE_INVALID', `Fonte desconhecida: ${source}.`, 'Use freshrss, gmail ou searxng.');
      } else throw new ExportFailure('SUBSOLO_CLI_PROVIDER_INVALID', `Provider desconhecido: ${provider}.`, 'Use fixture ou live.');
      const workbook = JSON.parse(await readFile(new URL('../templates/google/sheets/workbook.schema.json', import.meta.url), 'utf8'));
      const headers = workbook.tabs.PAUTAS.map(column => column.name);
      let repository;
      const spreadsheetId = value('--spreadsheet-id') ?? process.env.SUBSOLO_GOOGLE_SPREADSHEET_ID;
      if (spreadsheetId && provider === 'live') {
        const { createGoogleSheetsPitchRepository, createIngestionTokenProvider } = await import('../src/lib/infrastructure/ingestion/google-sheets-pitch-writer.mjs');
        const { createStructuredLogger } = await import('../src/lib/infrastructure/google/google-workspace.mjs');
        const logger = createStructuredLogger({ sink: structuredStderr, verbose: has('--verbose') });
        repository = createGoogleSheetsPitchRepository({ spreadsheetId, range: value('--sheet-range') ?? 'PAUTAS!A:AZ', headers, tokenProvider: createIngestionTokenProvider({ logger }), logger });
      } else {
        const { createFilePitchRepository } = await import('../src/lib/infrastructure/ingestion/file-ingestion-store.mjs'); repository = createFilePitchRepository({ statePath });
      }
      const { createFileQuarantine } = await import('../src/lib/infrastructure/ingestion/file-ingestion-store.mjs');
      const quarantine = createFileQuarantine({ directory: path.resolve(output, 'quarantine') });
      const { ingestEditorialEntries, triageReportMarkdown } = await import('../src/lib/application/editorial-ingestion.mjs');
      const report = await ingestEditorialEntries({ source, entries, repository, quarantine, mode, config: { ...config, ...sourceMeta } });
      if (mode === 'apply') { await mkdir(output,{recursive:true}); await writeFile(path.resolve(output,'triage-report.json'),`${JSON.stringify(report,null,2)}\n`); await writeFile(path.resolve(output,'triage-report.md'),triageReportMarkdown(report)); }
      console.log(JSON.stringify({ ...report, provider, output: path.resolve(output), sheets_write: Boolean(spreadsheetId && provider === 'live') }, null, 2));
    } else if (command === 'media') {
      if (has('--dry-run') === has('--apply')) throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID','Escolha exatamente um modo.','Use --dry-run ou --apply.');
      const manifestPath=requiredValue('--manifest','SUBSOLO_MEDIA_MANIFEST_MISSING'); const destination=requiredValue('--destination','SUBSOLO_MEDIA_DESTINATION_MISSING');
      const { createPillowMediaProcessor }=await import('../src/lib/infrastructure/media/pillow-media-processor.mjs');
      const { planMediaProcessing, applyMediaProcessing }=await import('../src/lib/application/process-media.mjs');
      const processor=createPillowMediaProcessor({timeoutMs:Number(value('--timeout-ms')??120000)});
      const options={manifestPath,destination,processor,projectRoot:process.cwd(),overwrite:has('--overwrite')};
      const result=has('--dry-run')?await planMediaProcessing(options):await applyMediaProcessing(options);
      console.log(JSON.stringify(result,null,2));
    } else if (command === 'export-doc') {
      const provider = value('--provider') ?? 'fixture';
      const destination = requiredValue('--destination');
      if (has('--dry-run') === has('--apply')) {
        throw new ExportFailure('SUBSOLO_CLI_MODE_INVALID', 'Escolha exatamente um modo.', 'Use --dry-run ou --apply.');
      }

      let result;
      if (provider === 'fixture') {
        const sheetPath = requiredValue('--sheet');
        const documentPath = requiredValue('--document');
        result = has('--dry-run')
          ? await planExport({ sheetPath, documentPath, destination })
          : await applyExport({ sheetPath, documentPath, destination, overwrite: has('--overwrite') });
      } else if (provider === 'google') {
        const articleId = requiredValue('--article-id');
        const spreadsheetId = value('--spreadsheet-id') ?? process.env.SUBSOLO_GOOGLE_SPREADSHEET_ID;
        if (!spreadsheetId) {
          throw new ExportFailure('SUBSOLO_GOOGLE_SHEETS_ID_INVALID', 'O spreadsheetId não foi configurado.', 'Informe --spreadsheet-id ou SUBSOLO_GOOGLE_SPREADSHEET_ID.');
        }
        const { createDefaultGoogleTokenProvider, createGoogleDocsProvider, createGoogleSheetsProvider, createStructuredLogger, loadGoogleEditorialInput } = await import('../src/lib/infrastructure/google/google-workspace.mjs');
        const logger = createStructuredLogger({ sink: structuredStderr, verbose: has('--verbose') });
        const tokenProvider = createDefaultGoogleTokenProvider({ logger });
        const common = { tokenProvider, logger, timeoutMs: Number(value('--timeout-ms') ?? process.env.SUBSOLO_GOOGLE_TIMEOUT_MS ?? 10_000), maxAttempts: Number(value('--max-attempts') ?? process.env.SUBSOLO_GOOGLE_MAX_ATTEMPTS ?? 3), cacheTtlMs: Number(process.env.SUBSOLO_GOOGLE_CACHE_TTL_MS ?? 0) };
        const sheetProvider = createGoogleSheetsProvider({ ...common, spreadsheetId, range: value('--sheet-range') ?? process.env.SUBSOLO_GOOGLE_SHEETS_RANGE ?? 'ARTIGOS!A:AZ', pageSize: Number(value('--page-size') ?? process.env.SUBSOLO_GOOGLE_SHEETS_PAGE_SIZE ?? 200) });
        const documentProvider = createGoogleDocsProvider({ ...common, tabId: value('--tab-id') ?? process.env.SUBSOLO_GOOGLE_DOCS_TAB_ID ?? null });
        const input = await loadGoogleEditorialInput({ articleId, documentId: value('--document-id') ?? null, sheetProvider, documentProvider });
        result = has('--dry-run')
          ? await planExportFromInput({ ...input, destination })
          : await applyExportFromInput({ ...input, destination, overwrite: has('--overwrite') });
        result = { ...result, provider: 'google-readonly' };
      } else {
        throw new ExportFailure('SUBSOLO_CLI_PROVIDER_INVALID', `Provider desconhecido: ${provider}.`, 'Use fixture ou google.');
      }
      console.log(JSON.stringify(result, null, 2));
    } else {
      throw new ExportFailure('SUBSOLO_CLI_COMMAND_INVALID', 'Comando ausente ou inválido.', 'Use export-doc, media, package, restore, validate-package, publish, orchestrate, reconcile, edition, ingest ou post-publication.');
    }
  }
} catch (error) {
  const payload = typeof error?.toJSON === 'function'
    ? error.toJSON()
    : error instanceof ExportFailure
      ? error.toJSON()
      : { code: 'SUBSOLO_UNEXPECTED', message: error instanceof Error ? error.message : String(error), action: 'Consulte o log e corrija a entrada.' };
  console.error(JSON.stringify(payload, null, 2));
  process.exitCode = 2;
}
