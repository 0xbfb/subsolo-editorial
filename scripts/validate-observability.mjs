import { readFile } from 'node:fs/promises';
const monitors=JSON.parse(await readFile('infra/uptime-kuma/monitors.json','utf8'));
const errors=[];
if(monitors.schema_version!==1)errors.push('schema_version de monitores inválida');
const all=[...(monitors.public??[]),...(monitors.local??[])];
if(all.length<9)errors.push(`monitores insuficientes: ${all.length}`);
const ids=new Set();
for(const monitor of all){if(ids.has(monitor.id))errors.push(`monitor duplicado: ${monitor.id}`);ids.add(monitor.id);if(!['http','tcp'].includes(monitor.type))errors.push(`tipo inválido: ${monitor.id}`);if(!(monitor.interval_seconds>=60))errors.push(`intervalo agressivo: ${monitor.id}`);if(monitor.type==='http'&&!monitor.url)errors.push(`URL ausente: ${monitor.id}`);}
const topics=JSON.parse(await readFile('infra/ntfy/topics.json','utf8'));
if(topics.schema_version!==1||!topics.topics?.critical)errors.push('catálogo ntfy inválido');
const scheduled=await readFile('.github/workflows/scheduled-checks.yml','utf8');
if(!/schedule:/.test(scheduled)||!/scripts\/smoke-site\.mjs/.test(scheduled))errors.push('smoke externo agendado ausente');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log(`Observabilidade válida: ${all.length} monitores, ${Object.keys(topics.topics).length} tópicos e smoke externo agendado.`);
