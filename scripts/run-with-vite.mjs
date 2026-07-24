import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error('Usage: node scripts/run-with-vite.mjs <command> [...args]');

const server = await createServer({
  root: process.cwd(),
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
});
await server.listen();
try {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      BASE_URL: 'http://127.0.0.1:5178',
    },
  });
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  if (exitCode !== 0) process.exitCode = exitCode ?? 1;
} finally {
  await server.close();
}
