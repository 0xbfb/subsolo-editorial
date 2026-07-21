import path from 'node:path';import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {planPackage,applyPackage} from '../../../cli/packager-core.mjs';
import {editionMarkdown,toPackageEdition} from './edition-lifecycle.mjs';
const stable=(v)=>`${JSON.stringify(v,null,2)}\n`;
export const packageLifecycleRevision=async({state,workspaceTemplate,destination,previousPackage=null,mode='dry-run'})=>{
  const generated_at=state.history.at(-1)?.at??state.published_at;const edition=toPackageEdition(state,{generated_at});
  const staging=path.resolve('.tmp',`edition-lifecycle-${process.pid}-${Date.now()}`);await mkdir(path.dirname(staging),{recursive:true});
  try{await cp(path.resolve(workspaceTemplate),staging,{recursive:true});await writeFile(path.join(staging,'edition.json'),stable(edition));await writeFile(path.join(staging,'edition.md'),editionMarkdown(state));const options={workspace:staging,destination,previousPackage};return mode==='apply'?await applyPackage(options):await planPackage(options);}finally{await rm(staging,{recursive:true,force:true});}
};
export const readEditionState=async(file)=>JSON.parse(await readFile(file,'utf8'));
