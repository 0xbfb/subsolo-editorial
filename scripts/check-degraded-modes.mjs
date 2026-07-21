import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { htmlAttributes, parseArgs, projectRoot, readJson, relativePosix, walkFiles } from './hardening-utils.mjs';

const exists=async(path)=>{try{await access(path);return true;}catch{return false;}};
export const checkDegradedModes=async({root=projectRoot,site=null}={})=>{
  const budgets=await readJson(resolve(root,'config/hardening/performance-budgets.json'));
  const selected=site??(await exists(resolve(root,'dist'))?resolve(root,'dist'):resolve(root,'reports/prompt-06/preview'));
  const issues=[];if(!await exists(selected))return{status:'fail',issues:[`Artefato inexistente: ${selected}`]};
  const files=await walkFiles(selected);const htmlFiles=files.filter(({path})=>path.endsWith('.html'));
  let worstSeconds=0;let pagesWithoutJs=0;
  for(const file of htmlFiles){const html=await readFile(file.path,'utf8');const name=relativePosix(selected,file.path);const withoutScripts=html.replace(/<script\b[\s\S]*?<\/script>/gi,'');
    if(/<main\b[^>]*id=["']conteudo["'][^>]*>[\s\S]*?<h1\b/i.test(withoutScripts))pagesWithoutJs+=1;else if(!/http-equiv=["']refresh/i.test(html))issues.push(`${name}: conteúdo crítico depende de JavaScript.`);
    for(const asset of [...htmlAttributes(html,'script'),...htmlAttributes(html,'link'),...htmlAttributes(html,'img')]){const ref=asset.attrs.src??asset.attrs.href;if(ref&&/^https?:\/\//i.test(ref))issues.push(`${name}: recurso essencial externo ${ref}.`);}
    if(/<form\b/i.test(html)&&!/noscript/i.test(html)&&/data-search-form/.test(html))issues.push(`${name}: busca sem fallback noscript.`);
    const criticalBytes=Buffer.byteLength(html,'utf8');const seconds=(criticalBytes*8)/(budgets.slow_connection_profile.downlink_kbps*1000)+(budgets.slow_connection_profile.round_trip_ms/1000)*2;worstSeconds=Math.max(worstSeconds,seconds);
  }
  if(worstSeconds>budgets.slow_connection_profile.critical_content_seconds)issues.push(`HTML crítico estimado em ${worstSeconds.toFixed(2)}s na conexão lenta.`);
  const portrait=await readFile(resolve(root,'src/components/media/Portrait.astro'),'utf8');if(!/portrait-placeholder/.test(portrait)||!/portrait__media/.test(portrait))issues.push('Retrato sem fallback para mídia ausente.');
  const css=await readFile(resolve(root,'src/styles/jornal-concreto.css'),'utf8');if(!/\.theme-toggle \{[\s\S]*display: none/.test(css)||!/\.js \.theme-toggle/.test(css))issues.push('Controle progressivo de tema não degrada sem JS.');
  return{status:issues.length?'fail':'pass',issues,site:selected,htmlFiles:htmlFiles.length,pagesWithCriticalContentWithoutJs:pagesWithoutJs,worstHtmlOnlySeconds:Number(worstSeconds.toFixed(3)),profile:budgets.slow_connection_profile};
};
if(import.meta.url===`file://${process.argv[1]}`){const args=parseArgs(process.argv.slice(2));const report=await checkDegradedModes({root:resolve(args.root??projectRoot),site:args.site?resolve(args.site):null});if(args.report)await writeFile(resolve(args.report),`${JSON.stringify(report,null,2)}\n`);if(report.issues.length){console.error('SUBSOLO_DEGRADED_MODE_FAILED');console.error(report.issues.join('\n'));process.exit(1);}console.log(`Modos degradados aprovados: ${report.pagesWithCriticalContentWithoutJs}/${report.htmlFiles} páginas com conteúdo crítico sem JS; pior HTML ${report.worstHtmlOnlySeconds}s.`);}
