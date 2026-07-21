import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { checkMinimumPermissions } from './check-minimum-permissions.mjs';
import { checkSecurityHeaders } from './check-security-headers.mjs';
import { parseArgs, projectRoot, readJson } from './hardening-utils.mjs';
import { scanRepositorySecrets } from './scan-repository-secrets.mjs';

const exists=async(path)=>{try{await access(path);return true;}catch{return false;}};
export const auditSecurity=async({root=projectRoot,requireLockfile=false}={})=>{
  const pkg=await readJson(resolve(root,'package.json'));const licenses=await readJson(resolve(root,'licenses/direct-dependencies.json'));const advisories=await readJson(resolve(root,'security/advisory-decisions.json'));
  const issues=[];const blockers=[];const all={...pkg.dependencies,...pkg.devDependencies};
  for(const [name,version] of Object.entries(all)){
    if(!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))issues.push(`${name}: versão não exata ${version}.`);
    const entry=licenses.packages.find((item)=>item.name===name&&item.version===version);if(!entry)issues.push(`${name}@${version}: revisão de licença ausente.`);else if(!licenses.allowed_licenses.includes(entry.license)||entry.decision!=='accepted')issues.push(`${name}@${version}: licença/decisão não aceita.`);
  }
  for(const entry of licenses.packages)if(all[entry.name]!==entry.version)issues.push(`${entry.name}@${entry.version}: inventário não corresponde ao package.json.`);
  for(const advisory of advisories.advisories)if(!advisory.decision||!advisory.owner||!advisory.deadline)issues.push(`Advisory ${advisory.id??'sem-id'} sem decisão completa.`);
  const lockfile=await exists(resolve(root,'pnpm-lock.yaml'));if(!lockfile)blockers.push('pnpm-lock.yaml ausente: auditoria transitiva de vulnerabilidades e licenças permanece bloqueadora para 1.0.0.');
  if(requireLockfile&&!lockfile)issues.push(blockers.at(-1));
  const [secrets,headers,permissions]=await Promise.all([scanRepositorySecrets({root}),checkSecurityHeaders({root}),checkMinimumPermissions({root})]);
  issues.push(...secrets.findings.map((item)=>`${item.code} ${item.file}`),...headers.issues,...permissions.issues);
  return{status:issues.length?'fail':blockers.length?'conditional-pass':'pass',issues,blockers,directDependencies:Object.keys(all).length,reviewedLicenses:licenses.packages.length,advisoryDecisions:advisories.advisories.length,lockfile,secrets:{status:secrets.status,scannedFiles:secrets.scannedFiles},headers:{status:headers.status},permissions:{status:permissions.status,workflows:permissions.workflows,services:permissions.serviceCount}};
};
if(import.meta.url===`file://${process.argv[1]}`){const args=parseArgs(process.argv.slice(2));const report=await auditSecurity({root:resolve(args.root??projectRoot),requireLockfile:Boolean(args['require-lockfile']||process.env.SUBSOLO_REQUIRE_LOCKFILE==='1')});if(args.report)await writeFile(resolve(args.report),`${JSON.stringify(report,null,2)}\n`);if(report.issues.length){console.error('SUBSOLO_SECURITY_AUDIT_FAILED');console.error(report.issues.join('\n'));process.exit(1);}console.log(`Auditoria de segurança ${report.status}: ${report.directDependencies} dependências diretas, ${report.secrets.scannedFiles} arquivos varridos.${report.blockers.length?` Bloqueador registrado: ${report.blockers[0]}`:''}`);}
