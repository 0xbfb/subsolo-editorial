import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(new URL('../..',import.meta.url).pathname);
const cli=path.join(root,'cli/subsolo.mjs');
const run=(args)=>spawnSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8'});

test('CLI fixture dry-run has no filesystem effects',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-ingest-dry-'));const state=path.join(dir,'state.json');const output=path.join(dir,'reports');
  const result=run(['ingest','--source','freshrss','--provider','fixture','--input','fixtures/ingestion/freshrss.json','--state',state,'--output',output,'--dry-run']);
  assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);assert.equal(report.planned_count,2);assert.equal(report.publication_effects,false);
  await assert.rejects(access(state));await assert.rejects(access(output));await rm(dir,{recursive:true,force:true});
});

test('CLI apply writes pitches and triage reports only',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-ingest-apply-'));const state=path.join(dir,'state.json');const output=path.join(dir,'reports');
  const result=run(['ingest','--source','gmail','--provider','fixture','--input','fixtures/ingestion/gmail-trusted.json','--policy','fixtures/ingestion/policy.json','--state',state,'--output',output,'--apply']);
  assert.equal(result.status,0,result.stderr);const rows=JSON.parse(await readFile(state,'utf8'));assert.equal(rows.length,1);assert.equal(rows[0].status,'TRIAGEM');assert.equal(rows[0].classificacao_preliminar,'PRELIMINAR_NAO_EDITORIAL');
  const report=JSON.parse(await readFile(path.join(output,'triage-report.json'),'utf8'));assert.equal(report.created_count,1);assert.equal(report.publication_effects,false);
  assert.match(await readFile(path.join(output,'triage-report.md'),'utf8'),/Nenhuma publicação foi criada/);
  await access(path.join(output,'quarantine'));await rm(dir,{recursive:true,force:true});
});

test('repeated fixture apply does not duplicate a pitch',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'subsolo-ingest-repeat-'));const state=path.join(dir,'state.json');const output=path.join(dir,'reports');const args=['ingest','--source','freshrss','--provider','fixture','--input','fixtures/ingestion/freshrss.json','--state',state,'--output',output,'--apply'];
  assert.equal(run(args).status,0);const second=run(args);assert.equal(second.status,0,second.stderr);const report=JSON.parse(second.stdout);assert.equal(report.duplicate_count,2);const rows=JSON.parse(await readFile(state,'utf8'));assert.equal(rows.length,2);await rm(dir,{recursive:true,force:true});
});

test('live Gmail without token fails closed',()=>{
  const result=run(['ingest','--source','gmail','--provider','live','--state','.runtime/nope.json','--output','.runtime/nope','--dry-run']);
  assert.equal(result.status,2);assert.match(result.stderr,/SUBSOLO_INGEST_GMAIL_AUTH_MISSING/);
});
