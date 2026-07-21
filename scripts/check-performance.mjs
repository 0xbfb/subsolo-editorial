import { access, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { gzipBytes, htmlAttributes, localAssetPath, parseArgs, projectRoot, readJson, relativePosix, walkFiles } from './hardening-utils.mjs';

const exists = async (path) => { try { await access(path); return true; } catch { return false; } };

export const checkPerformance = async ({root=projectRoot,site=null}={}) => {
  const budgets=await readJson(resolve(root,'config/hardening/performance-budgets.json'));
  const selected=site??(await exists(resolve(root,'dist'))?resolve(root,'dist'):resolve(root,'reports/prompt-06/preview'));
  const issues=[];
  if(!await exists(selected)) return {status:'fail',issues:[`Artefato inexistente: ${selected}`],site:selected};
  const files=await walkFiles(selected);
  const htmlFiles=files.filter(({path})=>extname(path).toLowerCase()==='.html');
  const fileMap=new Map(files.map((file)=>[resolve(file.path),file]));
  let total=0; for(const file of files) total+=file.stats.size;
  if(total>budgets.site.total_artifact_bytes) issues.push(`Artefato ${total} > ${budgets.site.total_artifact_bytes}.`);
  if(htmlFiles.length>budgets.site.maximum_route_count) issues.push(`Rotas ${htmlFiles.length} > ${budgets.site.maximum_route_count}.`);
  let worst={route:null,initialTransfer:0,html:0,htmlGzip:0,css:0,cssGzip:0,js:0,blockingJs:0,largestImage:0};
  for(const file of htmlFiles){
    const html=await readFile(file.path);
    const htmlText=html.toString('utf8');
    const metrics={route:relativePosix(selected,file.path),html:html.byteLength,htmlGzip:gzipBytes(html),css:0,cssGzip:0,js:0,blockingJs:0,largestImage:0,initialTransfer:0};
    const seen=new Set();
    for(const link of htmlAttributes(htmlText,'link')){
      if(link.attrs.rel!=='stylesheet'||!link.attrs.href) continue;
      const path=localAssetPath(selected,file.path,link.attrs.href); if(!path||seen.has(path))continue;seen.add(path);
      const asset=fileMap.get(resolve(path));if(!asset){issues.push(`${metrics.route}: CSS ausente ${link.attrs.href}`);continue;}
      const bytes=await readFile(asset.path);metrics.css+=bytes.byteLength;metrics.cssGzip+=gzipBytes(bytes);
    }
    for(const script of htmlAttributes(htmlText,'script')){
      if(!script.attrs.src) continue;
      const path=localAssetPath(selected,file.path,script.attrs.src);if(!path||seen.has(path))continue;seen.add(path);
      const asset=fileMap.get(resolve(path));if(!asset){issues.push(`${metrics.route}: JS ausente ${script.attrs.src}`);continue;}
      const bytes=await readFile(asset.path);metrics.js+=bytes.byteLength;
      if(!Object.hasOwn(script.attrs,'defer')&&!Object.hasOwn(script.attrs,'async')&&script.attrs.type!=='module')metrics.blockingJs+=bytes.byteLength;
    }
    for(const image of htmlAttributes(htmlText,'img')){
      if(!image.attrs.src)continue;const path=localAssetPath(selected,file.path,image.attrs.src);if(!path)continue;
      const asset=fileMap.get(resolve(path));if(!asset){issues.push(`${metrics.route}: imagem ausente ${image.attrs.src}`);continue;}
      metrics.largestImage=Math.max(metrics.largestImage,asset.stats.size);
    }
    metrics.initialTransfer=metrics.htmlGzip+metrics.cssGzip+metrics.js+metrics.largestImage;
    if(metrics.html>budgets.route.html_uncompressed_bytes)issues.push(`${metrics.route}: HTML ${metrics.html} excede budget.`);
    if(metrics.htmlGzip>budgets.route.html_gzip_bytes)issues.push(`${metrics.route}: HTML gzip ${metrics.htmlGzip} excede budget.`);
    if(metrics.css>budgets.route.critical_css_uncompressed_bytes)issues.push(`${metrics.route}: CSS ${metrics.css} excede budget.`);
    if(metrics.cssGzip>budgets.route.critical_css_gzip_bytes)issues.push(`${metrics.route}: CSS gzip ${metrics.cssGzip} excede budget.`);
    if(metrics.js>budgets.route.initial_javascript_uncompressed_bytes)issues.push(`${metrics.route}: JS ${metrics.js} excede budget.`);
    if(metrics.blockingJs>budgets.route.blocking_javascript_uncompressed_bytes)issues.push(`${metrics.route}: JS bloqueante ${metrics.blockingJs} excede budget.`);
    if(metrics.largestImage>budgets.route.largest_image_bytes)issues.push(`${metrics.route}: imagem ${metrics.largestImage} excede budget.`);
    if(metrics.initialTransfer>budgets.route.initial_transfer_estimate_bytes)issues.push(`${metrics.route}: transferência inicial estimada ${metrics.initialTransfer} excede budget.`);
    if(metrics.initialTransfer>worst.initialTransfer)worst=metrics;
  }
  const archiveInArtifact=resolve(selected,'archive-index.json');
  const archiveFallback=resolve(root,'public/archive-index.json');
  const archive=await exists(archiveInArtifact)?archiveInArtifact:(await exists(archiveFallback)?archiveFallback:null);
  const archiveBytes=archive?(await stat(archive)).size:0;
  if(!archive)issues.push('archive-index.json não foi encontrado no artefato nem em public/.');
  if(archiveBytes>budgets.site.archive_index_bytes)issues.push(`archive-index ${archiveBytes} excede budget.`);
  const pagefind=files.filter(({path})=>relativePosix(selected,path).startsWith('pagefind/')).reduce((sum,file)=>sum+file.stats.size,0);
  if(pagefind>budgets.site.pagefind_index_bytes)issues.push(`Pagefind ${pagefind} excede budget.`);
  return {status:issues.length?'fail':'pass',issues,site:selected,files:files.length,routes:htmlFiles.length,totalBytes:total,archiveIndexBytes:archiveBytes,archiveIndexSource:archive?relativePosix(root,archive):null,pagefindBytes:pagefind,pagefindAvailable:pagefind>0,worstRoute:worst,budgets};
};

if(import.meta.url===`file://${process.argv[1]}`){const args=parseArgs(process.argv.slice(2));const report=await checkPerformance({root:resolve(args.root??projectRoot),site:args.site?resolve(args.site):null});if(args.report)await writeFile(resolve(args.report),`${JSON.stringify(report,null,2)}\n`);if(report.issues.length){console.error('SUBSOLO_PERFORMANCE_BUDGET_FAILED');console.error(report.issues.join('\n'));process.exit(1);}console.log(`Budgets aprovados: ${report.routes} rotas, ${report.totalBytes} bytes; pior rota ${report.worstRoute.route} com ${report.worstRoute.initialTransfer} bytes estimados.`);}
