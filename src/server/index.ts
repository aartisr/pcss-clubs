import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTenantFromRequest } from '../middleware/tenantRouting.ts';
import { authHandler } from './auth.ts';
import { SECURITY_HEADERS } from './securityHeaders.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!IS_PROD) {
    const { loadEnv } = await import('vite');
    const localAuthEnv = loadEnv('development', process.cwd(), 'OIDC_');
    for (const [key, value] of Object.entries(localAuthEnv)) process.env[key] ??= value;
  }
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);
    next();
  });
  // Multi-tenant subdomain & path inspection middleware
  app.use((req, res, next) => {
    const forwardedHost = req.headers['x-forwarded-host'];
    const hostHeader = Array.isArray(forwardedHost)
      ? forwardedHost[0]
      : forwardedHost || req.headers.host;

    const url = new URL(req.originalUrl, 'http://localhost');
    const tenant = resolveTenantFromRequest(hostHeader, url.pathname, url.searchParams);

    res.locals.tenant = tenant;
    res.setHeader('X-PCSS-Tenant-Mode', tenant.mode);
    if (tenant.campusSlug) {
      res.setHeader('X-PCSS-Campus', tenant.campusSlug);
    }
    if (tenant.clubSlug) {
      res.setHeader('X-PCSS-Club', tenant.clubSlug);
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'pcssclubs-portal' });
  });

  app.get('/api/tenant', (_req, res) => {
    res.json(res.locals.tenant);
  });

  app.all('/api/auth/:action', async (req, res) => {
    const action = req.params.action;
    if (!['start', 'callback', 'session', 'logout'].includes(action)) return res.sendStatus(404);
    const origin = `${req.protocol}://${req.get('host')}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value);
    const response = await authHandler(new Request(new URL(req.originalUrl, origin), { method: req.method, headers }), action as 'start' | 'callback' | 'session' | 'logout');
    res.status(response.status);
    response.headers.forEach((value, key) => { if (key !== 'set-cookie') res.setHeader(key, value); });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader('Set-Cookie', cookies);
    res.send(await response.text());
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(projectRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const listenHost = process.env.HOST || (IS_PROD ? '0.0.0.0' : '127.0.0.1');
  app.listen(PORT, listenHost, () => {
    console.log(`Pioneer Charter Club Portal server listening on http://${listenHost}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
