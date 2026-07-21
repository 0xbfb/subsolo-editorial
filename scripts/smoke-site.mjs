import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const args=process.argv.slice(2);
const value=(flag)=>{const index=args.indexOf(flag);return index>=0?args[index+1]:undefined;};
const positional=args[0]&&!args[0].startsWith('--')?args[0]:null;
const fixtureDir=value('--fixture-dir')??null;
const input=value('--url')??positional??process.env.SUBSOLO_SMOKE_URL;
if(!input&&!fixtureDir){console.error('SUBSOLO_SMOKE_URL_REQUIRED: informe a URL publicada ou --fixture-dir.');process.exit(9);}
const root=input?(input.endsWith('/')?input:`${input}/`):new URL(`file://${resolve(fixtureDir)}/`).href;
const attempts=Number(process.env.SUBSOLO_SMOKE_ATTEMPTS??4);
const delayMs=Number(process.env.SUBSOLO_SMOKE_DELAY_MS??3000);
const timeoutMs=Number(process.env.SUBSOLO_SMOKE_TIMEOUT_MS??8000);
const reportPath=value('--report')??process.env.SUBSOLO_SMOKE_REPORT??null;
const checks=[
  {path:'',kind:'html',pattern:/<title>[^<]*Subsolo/i},
  {path:'agora/',kind:'html',pattern:/<main[^>]+id=["']conteudo["']/i},
  {path:'arquivo/',kind:'html',pattern:/<main[^>]+id=["']conteudo["']/i},
  {path:'rss.xml',kind:'xml',pattern:/<rss\b/i},
  {path:'sitemap.xml',kind:'xml',pattern:/<urlset\b/i},
  {path:'archive-index.json',kind:'json'},
];
const sleep=(ms)=>new Promise((resolvePromise)=>setTimeout(resolvePromise,ms));
const results=[];
for(const check of checks){
  const url=new URL(check.path,root);let success=false;let lastError='sem resposta';let responseStatus=null;let bytes=0;let durationMs=0;
  for(let attempt=1;attempt<=attempts;attempt+=1){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);const started=Date.now();
    try{
      let body; let response;
      if(fixtureDir){
        const relative=check.path===''?'index.html':check.path.endsWith('/')?`${check.path}index.html`:check.path;
        body=await readFile(resolve(fixtureDir,relative),'utf8'); response={ok:true,status:200};
      }else{
        response=await fetch(url,{headers:{'user-agent':'subsolo-external-smoke/0.9.0'},redirect:'follow',signal:controller.signal}); body=await response.text();
      }
      durationMs=Date.now()-started;responseStatus=response.status;bytes=Buffer.byteLength(body);
      let valid=response.ok;
      if(valid&&check.pattern)valid=check.pattern.test(body);
      if(valid&&check.kind==='json'){try{const parsed=JSON.parse(body);valid=Array.isArray(parsed)||typeof parsed==='object';}catch{valid=false;}}
      if(valid){success=true;lastError=null;break;}
      lastError=`HTTP ${response.status}; conteúdo ${check.kind} inválido`;
    }catch(error){durationMs=Date.now()-started;lastError=error?.name==='AbortError'?'timeout':String(error?.message??error);}finally{clearTimeout(timer);}
    if(attempt<attempts)await sleep(delayMs);
  }
  const result={path:check.path||'/',url:String(url),kind:check.kind,ok:success,status:responseStatus,duration_ms:durationMs,bytes,error:lastError};results.push(result);
  console.log(`${success?'OK':'FAIL'} ${responseStatus??'-'} ${durationMs}ms ${url}`);
}
const report={schema_version:1,checked_at:new Date().toISOString(),root_url:root,ok:results.every((item)=>item.ok),checks:results,metrics:{checks:results.length,failed:results.filter((item)=>!item.ok).length,total_bytes:results.reduce((sum,item)=>sum+item.bytes,0),max_duration_ms:Math.max(...results.map((item)=>item.duration_ms))}};
if(reportPath){const target=resolve(reportPath);await mkdir(dirname(target),{recursive:true});await writeFile(target,`${JSON.stringify(report,null,2)}\n`);}
if(!report.ok){console.error('SUBSOLO_SMOKE_FAILED');for(const item of results.filter((entry)=>!entry.ok))console.error(`${item.url}: ${item.error}`);process.exit(8);}
console.log('Smoke test externo aprovado.');
