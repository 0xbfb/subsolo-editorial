import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { buildArchiveIndex, buildRss, facetCounts, paginateEntries } from '../src/lib/domain/discovery.mjs';
import { parseArgs, projectRoot, readJson } from './hardening-utils.mjs';

export const runScaleTest=async({root=projectRoot,count=null}={})=>{
  const budgets=await readJson(resolve(root,'config/hardening/performance-budgets.json'));
  const total=count??budgets.scale.synthetic_publications;
  const before=process.memoryUsage().heapUsed;const start=performance.now();
  const entries=Array.from({length:total},(_,index)=>{
    const day=String((index%28)+1).padStart(2,'0');const month=String((Math.floor(index/28)%12)+1).padStart(2,'0');const year=2020+(Math.floor(index/336)%30);
    return Object.freeze({id:`scale-${String(index).padStart(6,'0')}`,slug:`registro-sintetico-${index}`,date:`${year}-${month}-${day}`,publishedAt:`${year}-${month}-${day}T12:00:00-03:00`,updatedAt:null,channel:`canal-${index%9}`,type:index%7===0?'boletim':'reportagem',state:'confirmado',title:`Registro sintético ${index}`,summary:`Resumo determinístico do registro ${index}, usado apenas no teste de escala.`,authors:Object.freeze([`autor-${index%44}`]),editor:`editor-${index%11}`,topics:Object.freeze([`tema-${index%18}`,`tema-${(index+3)%18}`]),story:index%10===0?`historia-${index%25}`:null,correctionCount:index%37===0?1:0,latestCorrection:null,bodyVisibility:'full',href:`/arquivo/registros/registro-sintetico-${index}/`,recordKind:'archive-record'});
  });
  const facets=facetCounts(entries);const page=paginateEntries(entries,Math.ceil(total/budgets.scale.page_size),budgets.scale.page_size);const index=buildArchiveIndex(entries,'2026-07-21T00:00:00Z');
  const serialized=JSON.stringify(index);const rss=buildRss({entries,title:'Escala',description:'Teste',origin:'https://subsolo.example',feedPath:'/rss.xml',limit:budgets.scale.rss_items});
  const duration=performance.now()-start;const heapDelta=Math.max(0,process.memoryUsage().heapUsed-before);
  const issues=[];
  if(duration>budgets.scale.generation_ms)issues.push(`Geração ${duration.toFixed(1)}ms > ${budgets.scale.generation_ms}ms.`);
  if(heapDelta>budgets.scale.heap_delta_bytes)issues.push(`Heap ${heapDelta} > ${budgets.scale.heap_delta_bytes}.`);
  if(Buffer.byteLength(serialized)>budgets.scale.archive_index_bytes)issues.push(`Índice ${Buffer.byteLength(serialized)} > ${budgets.scale.archive_index_bytes}.`);
  if(page.items.length!==budgets.scale.page_size)issues.push('Última página não respeita page size no corpus sintético.');
  if(Object.keys(facets.channel).length!==9||Object.keys(facets.author).length!==44)issues.push('Facetas perderam cardinalidade.');
  const rssItems=(rss.match(/<item>/g)??[]).length;if(rssItems!==budgets.scale.rss_items)issues.push(`RSS retornou ${rssItems} itens.`);
  return{status:issues.length?'fail':'pass',issues,publications:total,durationMs:Number(duration.toFixed(2)),heapDeltaBytes:heapDelta,archiveIndexBytes:Buffer.byteLength(serialized),facets:{channels:Object.keys(facets.channel).length,authors:Object.keys(facets.author).length,topics:Object.keys(facets.topic).length},pageCount:Math.ceil(total/budgets.scale.page_size),rssItems,budgets:budgets.scale};
};
if(import.meta.url===`file://${process.argv[1]}`){const args=parseArgs(process.argv.slice(2));const report=await runScaleTest({root:resolve(args.root??projectRoot),count:args.count?Number(args.count):null});if(args.report)await writeFile(resolve(args.report),`${JSON.stringify(report,null,2)}\n`);if(report.issues.length){console.error('SUBSOLO_SCALE_FAILED');console.error(report.issues.join('\n'));process.exit(1);}console.log(`Escala aprovada: ${report.publications} registros, ${report.durationMs} ms, índice ${report.archiveIndexBytes} bytes, heap +${report.heapDeltaBytes}.`);}
