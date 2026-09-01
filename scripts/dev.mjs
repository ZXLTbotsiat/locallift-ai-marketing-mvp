import { spawn } from 'node:child_process';

const childOptions = { env: process.env, stdio: 'inherit' };
const proxy = spawn(process.execPath, ['--use-env-proxy', './scripts/groq-proxy.mjs'], childOptions);
const app = spawn(process.execPath, ['--use-env-proxy', './node_modules/vinext/dist/cli.js', 'dev'], childOptions);

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  proxy.kill('SIGTERM');
  app.kill('SIGTERM');
  setTimeout(() => process.exit(exitCode), 250);
}

proxy.on('exit', (code) => { if (!stopping && code) stop(code); });
app.on('exit', (code) => stop(code ?? 0));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
