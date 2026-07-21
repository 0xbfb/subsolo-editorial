import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../reports/prompt-06/preview',import.meta.url));
const manifest=new Set(JSON.parse(await readFile(join(root,'route-manifest.json'),'utf8')));
const files=[];
const walk=async(dir)=>{for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else if(entry.name==='index.html')files.push(path);}};
await walk(root);
const errors=[];
for(const file of files){const html=await readFile(file,'utf8');for(const match of html.matchAll(/href="([^"]+)"/g)){const href=match[1];if(href.startsWith('http')||href.startsWith('#')||href.startsWith('../')||href.startsWith('assets/'))continue;if(href.startsWith('/')&&!manifest.has(href)&&!href.includes('.'))errors.push(`${relative(root,file)} -> ${href}`);}}
if(errors.length){console.error(`Links internos sem destino:\n${errors.join('\n')}`);process.exit(1);}console.log(`${files.length} páginas e links internos validados.`);
