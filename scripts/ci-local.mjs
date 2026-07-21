import { spawnSync } from 'node:child_process';

const commands = [
  ['pnpm', ['verify:workflows']],
  ['pnpm', ['lint']],
  ['pnpm', ['typecheck']],
  ['pnpm', ['test']],
  ['pnpm', ['build']],
  ['pnpm', ['verify:dist']],
  ['pnpm', ['scan:public-artifact']],
  ['pnpm', ['format:check']],
];
for (const [command, args] of commands) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) {
    console.error(`SUBSOLO_CI_COMMAND_FAILED: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nCI local aprovado.');
