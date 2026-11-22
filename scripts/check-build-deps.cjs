const { existsSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');

const required = ['vite', 'typescript', 'tsx'];
const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));
const missing = required.filter((name) => {
  try {
    const manifest = projectRequire.resolve(`${name}/package.json`);
    return name === 'vite' && !existsSync(path.join(path.dirname(manifest), 'client.d.ts'));
  } catch {
    return true;
  }
});

if (missing.length) {
  console.error(`Build dependencies are missing: ${missing.join(', ')}. Run npm ci --include=dev before building. On Vercel, use the install command in vercel.json and redeploy without the old dependency cache.`);
  process.exitCode = 1;
} else {
  console.log('Build dependencies and Vite client types are installed.');
}
