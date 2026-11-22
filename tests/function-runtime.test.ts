import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

const emittedRoot = path.resolve('tmp/function-esm');
const origin = 'https://pcssclubs.org';
const routes = [
  ['session', 'GET'],
  ['start', 'GET'],
  ['callback', 'GET'],
  ['logout', 'POST'],
] as const;

function emittedFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? emittedFiles(filename) : filename.endsWith('.js') ? [filename] : [];
  });
}

function emittedRoute(route: string): string {
  return path.join(emittedRoot, 'api/auth', `${route}.js`);
}

async function withOidcEnvironment(values: Record<string, string>, run: () => Promise<void>): Promise<void> {
  const previous = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('OIDC_')));
  for (const key of Object.keys(previous)) delete process.env[key];
  Object.assign(process.env, values);
  try {
    await run();
  } finally {
    for (const key of Object.keys(process.env)) if (key.startsWith('OIDC_')) delete process.env[key];
    Object.assign(process.env, previous);
  }
}

test('every emitted relative import is an existing JavaScript file', () => {
  const files = emittedFiles(emittedRoot);
  assert.ok(files.length >= 6, 'Expected all auth entries and their shared modules');
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const line of source.split('\n')) {
      const specifier = line.match(/^\s*(?:import|export)\b.*?\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/)?.[1]
        ?? line.match(/^\s*import\s+['"](\.{1,2}\/[^'"]+)['"]/)?.[1];
      if (!specifier) continue;
      assert.equal(path.extname(specifier), '.js', `${file} has an extensionless or non-JavaScript import`);
      assert.ok(existsSync(path.resolve(path.dirname(file), specifier)), `${file} imports missing ${specifier}`);
    }
  }
});

test('root TypeScript config does not require browser-only Vite types for API functions', () => {
  const config = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf8')) as { compilerOptions: { types?: string[] } };
  assert.ok(!config.compilerOptions.types?.includes('vite/client'));
});

test('all four emitted auth entries load through native Node ESM', async () => {
  for (const [route, method] of routes) {
    const module = await import(pathToFileURL(emittedRoute(route)).href) as Record<string, unknown>;
    assert.equal(typeof module[method], 'function', `${route} should export ${method}`);
  }
});

test('deployed-style entrypoints give controlled responses without OIDC setup', async () => {
  await withOidcEnvironment({}, async () => {
    const session = await import(pathToFileURL(emittedRoute('session')).href);
    const start = await import(pathToFileURL(emittedRoute('start')).href);
    const callback = await import(pathToFileURL(emittedRoute('callback')).href);
    const logout = await import(pathToFileURL(emittedRoute('logout')).href);

    const sessionResponse: Response = await session.GET(new Request(`${origin}/api/auth/session`));
    assert.equal(sessionResponse.status, 200);
    assert.equal(sessionResponse.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await sessionResponse.json(), { configured: false, authenticated: false, canEdit: false });

    for (const [name, response] of [
      ['start', await start.GET(new Request(`${origin}/api/auth/start?returnTo=%2Feditor%2Fhome`))],
      ['callback', await callback.GET(new Request(`${origin}/api/auth/callback`))],
    ] as const) {
      assert.equal(response.status, 302, name);
      assert.equal(response.headers.get('cache-control'), 'no-store', name);
      const destination = new URL(response.headers.get('location')!);
      assert.equal(destination.origin, origin, name);
      assert.equal(destination.pathname, '/my', name);
      assert.equal(destination.searchParams.get('auth'), 'unavailable', name);
      if (name === 'start') assert.equal(destination.searchParams.get('returnTo'), '/editor/home');
    }

    const logoutResponse: Response = await logout.POST(new Request(`${origin}/api/auth/logout`, { method: 'POST', headers: { Origin: origin } }));
    assert.equal(logoutResponse.status, 503);
    assert.equal(logoutResponse.headers.get('cache-control'), 'no-store');
  });
});

test('emitted functions contain configuration and origin failures without crashing', async () => {
  const session = await import(pathToFileURL(emittedRoute('session')).href);
  const logout = await import(pathToFileURL(emittedRoute('logout')).href);
  const base = {
    OIDC_ISSUER: 'https://identity.example', OIDC_CLIENT_ID: 'client', OIDC_CLIENT_SECRET: 'secret',
    OIDC_APP_ORIGIN: origin, OIDC_SESSION_SECRET: Buffer.alloc(32, 7).toString('base64url'),
    OIDC_REQUIRED_HOSTED_DOMAIN: 'pioneercss.org',
  };

  await withOidcEnvironment({ ...base, OIDC_SESSION_SECRET: 'invalid' }, async () => {
    const response: Response = await session.GET(new Request(`${origin}/api/auth/session`));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'Authentication is misconfigured.');
  });

  await withOidcEnvironment(base, async () => {
    const guest: Response = await session.GET(new Request(`${origin}/api/auth/session`));
    assert.equal(guest.status, 200);
    assert.equal((await guest.json()).authenticated, false);
    const foreign: Response = await session.GET(new Request('https://other.example/api/auth/session'));
    assert.equal(foreign.status, 400);
    assert.deepEqual(await foreign.json(), { code: 'ORIGIN_MISMATCH', error: 'Invalid application origin.', requestOrigin: 'https://other.example', configuredOrigin: origin });
    const invalidLogout: Response = await logout.POST(new Request(`${origin}/api/auth/logout`, { method: 'POST' }));
    assert.equal(invalidLogout.status, 403);
    const validLogout: Response = await logout.POST(new Request(`${origin}/api/auth/logout`, { method: 'POST', headers: { Origin: origin } }));
    assert.equal(validLogout.status, 200);
    assert.ok(validLogout.headers.getSetCookie().some((cookie) => cookie.includes('Max-Age=0')));
  });
});

test('emitted start and callback functions preserve the sign-in handoff', async () => {
  const start = await import(pathToFileURL(emittedRoute('start')).href);
  const callback = await import(pathToFileURL(emittedRoute('callback')).href);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.endsWith('/.well-known/openid-configuration')) return Response.json({
      issuer: 'https://identity.example/', authorization_endpoint: 'https://identity.example/authorize',
      token_endpoint: 'https://identity.example/token', jwks_uri: 'https://identity.example/jwks',
      response_types_supported: ['code'], id_token_signing_alg_values_supported: ['ES256'],
      token_endpoint_auth_methods_supported: ['client_secret_post'], code_challenge_methods_supported: ['S256'],
    });
    throw new Error(`Unexpected provider request: ${url}`);
  };

  try {
    await withOidcEnvironment({
      OIDC_ISSUER: 'https://identity.example', OIDC_CLIENT_ID: 'client', OIDC_CLIENT_SECRET: 'secret',
      OIDC_APP_ORIGIN: origin, OIDC_SESSION_SECRET: Buffer.alloc(32, 7).toString('base64url'),
      OIDC_REQUIRED_HOSTED_DOMAIN: 'pioneercss.org',
    }, async () => {
      const started: Response = await start.GET(new Request(`${origin}/api/auth/start?returnTo=%2Fmy%2Fclubs&chooseAccount=1`));
      assert.equal(started.status, 302);
      assert.equal(started.headers.get('cache-control'), 'no-store');
      const authorization = new URL(started.headers.get('location')!);
      assert.equal(authorization.origin, 'https://identity.example');
      assert.equal(authorization.searchParams.get('redirect_uri'), `${origin}/api/auth/callback`);
      assert.equal(authorization.searchParams.get('prompt'), 'select_account');
      assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
      const flowCookie = started.headers.getSetCookie().find((cookie) => cookie.startsWith('__Host-pcss-flow='));
      assert.ok(flowCookie, 'The authorization handoff must bind a flow cookie');

      const failed: Response = await callback.GET(new Request(`${origin}/api/auth/callback?state=wrong&code=unused`, {
        headers: { Cookie: flowCookie.split(';')[0] },
      }));
      assert.equal(failed.status, 302);
      const destination = new URL(failed.headers.get('location')!);
      assert.equal(destination.origin, origin);
      assert.equal(destination.pathname, '/my');
      assert.equal(destination.searchParams.get('auth'), 'failed');
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});
