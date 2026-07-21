import { access, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const exists=async path=>{try{await access(path);return true;}catch(error){if(error?.code==='ENOENT')return false;throw error;}};
if(!await exists('public/media/media.json')){
  const manifest=JSON.parse(await readFile('src/data/media/manifest.json','utf8'));
  if(manifest.length!==0){console.error('SUBSOLO_MEDIA_MANIFEST_WITHOUT_ASSETS');process.exit(2);}
  console.log('Mídia pública: nenhum ativo aprovado; placeholders permanecem ativos.');
}else{
  const child=spawn(process.execPath,['scripts/validate-media-assets.mjs','public/media'],{stdio:'inherit'});
  child.on('close',code=>{process.exitCode=code??2;});
}
