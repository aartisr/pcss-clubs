import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { authHandler, getAuthConfig, safeReturnTo } from '../src/server/auth.ts';
import { authStartPath } from '../src/shared/authReturn.ts';

const origin = 'http://localhost:3000';
const secret = Buffer.alloc(32, 7).toString('base64url');
const baseEnv = {
  OIDC_ISSUER: 'https://identity.example', OIDC_CLIENT_ID: 'client', OIDC_CLIENT_SECRET: 'secret',
  OIDC_APP_ORIGIN: origin, OIDC_SESSION_SECRET: secret, OIDC_REQUIRED_HOSTED_DOMAIN: 'pioneercss.org',
  OIDC_ALLOWED_EMAILS: 'editor@pioneercss.org',
};

function request(path: string, cookie = '', method = 'GET', requestOrigin?: string): Request {
  return new Request(`${origin}${path}`, { method, headers: {
    ...(cookie ? { Cookie: cookie } : {}), ...(requestOrigin ? { Origin: requestOrigin } : {}),
  } });
}

function cookie(response: Response, name: string): string {
  const value = response.headers.getSetCookie().find((item) => item.startsWith(`${name}=`));
  assert.ok(value, `Expected ${name} cookie`);
  return value.split(';')[0];
}

function hasCleared(response: Response, name: string): boolean {
  return response.headers.getSetCookie().some((item) => item.startsWith(`${name}=;`) && item.includes('Max-Age=0'));
}

function destination(response: Response): URL {
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return new URL(response.headers.get('location')!);
}

test('authentication configuration and destination validation', () => {
  assert.equal(getAuthConfig({} as NodeJS.ProcessEnv), null);
  for (const [property, value] of [
    ['OIDC_ISSUER', 'http://identity.example'],
    ['OIDC_APP_ORIGIN', 'http://example.com'],
    ['OIDC_APP_ORIGIN', 'http://localhost:3000/path'],
    ['OIDC_SESSION_SECRET', 'weak'],
    ['OIDC_CLIENT_AUTH_METHOD', 'none'],
    ['OIDC_REQUIRED_HOSTED_DOMAIN', 'bad/domain'],
  ]) assert.throws(() => getAuthConfig({ ...baseEnv, [property]: value } as NodeJS.ProcessEnv), property);
  assert.equal(getAuthConfig({ ...baseEnv, OIDC_CLIENT_AUTH_METHOD: 'basic' } as NodeJS.ProcessEnv)?.clientAuthMethod, 'basic');
  assert.equal(getAuthConfig({ ...baseEnv, OIDC_EDIT_POLICY: 'authenticated' } as NodeJS.ProcessEnv)?.allowAll, true);
  for (const value of ['', '//other.test', '/\\other.test', 'https://other.test', '/ok\nLocation: evil']) {
    assert.equal(safeReturnTo(value), '/', value);
  }
  assert.equal(safeReturnTo('/support?tab=clubs#request'), '/support?tab=clubs#request');
  assert.equal(authStartPath('/my'), '/api/auth/start?returnTo=%2Fmy');
  assert.equal(authStartPath('/support#request', true), '/api/auth/start?returnTo=%2Fsupport%23request&chooseAccount=1');
  assert.equal(authStartPath('https://other.test', true), '/api/auth/start?returnTo=%2F&chooseAccount=1');
});

test('authentication request and account-switch path matrix', async (t) => {
  const oldEnv = { ...process.env };
  const oldFetch = globalThis.fetch;
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'ES256', use: 'sig' };
  let nonce = '';
  let challenge = '';
  let exchangeFails = false;
  let wrongNonce = false;
  let identity: { sub: string; email: string; email_verified: boolean; hd?: string } =
    { sub: 'editor-1', email: 'editor@pioneercss.org', email_verified: true, hd: 'pioneercss.org' };

  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.endsWith('/.well-known/openid-configuration')) return Response.json({
      issuer: 'https://identity.example/', authorization_endpoint: 'https://identity.example/authorize',
      token_endpoint: 'https://identity.example/token', jwks_uri: 'https://identity.example/jwks',
      response_types_supported: ['code'], id_token_signing_alg_values_supported: ['ES256'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'], code_challenge_methods_supported: ['S256'],
    });
    if (url.endsWith('/jwks')) return Response.json({ keys: [jwk] });
    if (url.endsWith('/token')) {
      if (exchangeFails) return Response.json({ error: 'invalid_grant' }, { status: 400 });
      const body = new URLSearchParams((init?.body as string) ?? '');
      if (body.has('code_verifier')) {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.get('code_verifier')!));
        assert.equal(Buffer.from(digest).toString('base64url'), challenge);
      }
      const idToken = await new SignJWT({ ...identity, name: 'Test Person', nonce: wrongNonce ? 'wrong' : nonce })
        .setProtectedHeader({ alg: 'ES256', kid: 'test-key' }).setIssuer('https://identity.example/')
        .setAudience('client').setSubject(identity.sub).setIssuedAt().setExpirationTime('5m').sign(privateKey);
      return Response.json({ access_token: 'test-token', token_type: 'Bearer', expires_in: 300, id_token: idToken });
    }
    throw new Error(`Unexpected provider request: ${url}`);
  };
  for (const key of Object.keys(process.env)) if (key.startsWith('OIDC_')) delete process.env[key];
  Object.assign(process.env, baseEnv);

  async function start(returnTo = '/my', extraCookie = '', choose = false) {
    const query = new URLSearchParams({ returnTo });
    if (choose) query.set('chooseAccount', '1');
    const response = await authHandler(request(`/api/auth/start?${query}`, extraCookie), 'start');
    const authorization = destination(response);
    assert.equal(authorization.origin, 'https://identity.example');
    assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(authorization.searchParams.get('hd'), 'pioneercss.org');
    assert.equal(authorization.searchParams.get('redirect_uri'), `${origin}/api/auth/callback`);
    return { response, authorization, flow: cookie(response, 'pcss-flow') };
  }

  async function finish(flow: Awaited<ReturnType<typeof start>>, extraCookie = '', suffix = 'code=test-code') {
    nonce = flow.authorization.searchParams.get('nonce')!;
    challenge = flow.authorization.searchParams.get('code_challenge')!;
    const path = `/api/auth/callback?${suffix}&state=${encodeURIComponent(flow.authorization.searchParams.get('state')!)}`;
    return authHandler(request(path, [extraCookie, flow.flow].filter(Boolean).join('; ')), 'callback');
  }

  try {
    await t.test('request methods, origins, and anonymous session', async () => {
      const guest = await authHandler(request('/api/auth/session'), 'session');
      assert.deepEqual(await guest.json(), { configured: true, authenticated: false, canEdit: false, role: null,
        capabilities: { saveClubs: false, requestClubSite: false, editPages: false }, user: null });
      assert.equal(guest.headers.get('cache-control'), 'no-store');
      for (const action of ['start', 'callback'] as const) {
        assert.equal((await authHandler(request(`/api/auth/${action}`, '', 'POST'), action)).status, 405);
      }
      for (const action of ['start', 'callback', 'session', 'logout'] as const) {
        assert.equal((await authHandler(new Request(`http://127.0.0.1:3000/api/auth/${action}`), action)).status, 400);
      }
      for (const [method, requestOrigin] of [['GET', origin], ['POST', 'https://other.test'], ['POST', undefined]] as const) {
        assert.equal((await authHandler(request('/api/auth/logout', '', method, requestOrigin), 'logout')).status, 403);
      }
    });

    let originalSession = '';
    await t.test('initial sign-in, repeat sign-in, and explicit switch', async () => {
      const first = await start('/editor/home');
      assert.equal(first.authorization.searchParams.has('prompt'), false);
      assert.match(first.response.headers.getSetCookie()[0], /HttpOnly; Path=\/; SameSite=Lax/);
      originalSession = cookie(await finish(first), 'pcss-session');
      const signedIn = await authHandler(request('/api/auth/session', originalSession), 'session');
      assert.equal((await signedIn.json()).role, 'editor');
      const repeat = await authHandler(request('/api/auth/start?returnTo=%2Fmy', originalSession), 'start');
      assert.equal(destination(repeat).href, `${origin}/my`);
      assert.equal(repeat.headers.getSetCookie().length, 0);
      const switchFlow = await start('/my', originalSession, true);
      assert.equal(switchFlow.authorization.searchParams.get('prompt'), 'select_account');
      assert.equal(hasCleared(switchFlow.response, 'pcss-session'), false);
      const stillSignedIn = await authHandler(request('/api/auth/session', originalSession), 'session');
      assert.equal((await stillSignedIn.json()).user.email, 'editor@pioneercss.org');
    });

    await t.test('cancelled, failed, and denied switches preserve the previous account', async () => {
      const cancelled = await start('/my/clubs', originalSession, true);
      const cancelledResult = await finish(cancelled, originalSession, 'error=access_denied');
      assert.equal(destination(cancelledResult).href, `${origin}/my?auth=cancelled&returnTo=%2Fmy%2Fclubs`);
      assert.equal(hasCleared(cancelledResult, 'pcss-session'), false);
      const failed = await start('/my', originalSession, true);
      exchangeFails = true;
      assert.equal(destination(await finish(failed, originalSession)).searchParams.get('auth'), 'failed');
      exchangeFails = false;
      const badNonce = await start('/my', originalSession, true);
      wrongNonce = true;
      assert.equal(destination(await finish(badNonce, originalSession)).searchParams.get('auth'), 'failed');
      wrongNonce = false;
      const denied = await start('/my', originalSession, true);
      identity = { sub: 'outsider', email: 'outside@example.com', email_verified: true, hd: 'example.com' };
      const deniedResult = await finish(denied, originalSession);
      assert.equal(destination(deniedResult).searchParams.get('auth'), 'switch-denied');
      assert.equal(deniedResult.headers.getSetCookie().some((item) => item.startsWith('pcss-session=')), false);
      assert.equal((await (await authHandler(request('/api/auth/session', originalSession), 'session')).json()).user.email, 'editor@pioneercss.org');
    });

    await t.test('successful switch replaces the identity and keeps the destination', async () => {
      identity = { sub: 'student-2', email: 'student@pioneercss.org', email_verified: true, hd: 'pioneercss.org' };
      const change = await start('/support#request-club-site', originalSession, true);
      const result = await finish(change, originalSession);
      assert.equal(destination(result).href, `${origin}/support#request-club-site`);
      const switchedSession = cookie(result, 'pcss-session');
      assert.notEqual(switchedSession, originalSession);
      const details = await (await authHandler(request('/api/auth/session', switchedSession), 'session')).json();
      assert.equal(details.user.email, 'student@pioneercss.org');
      assert.equal(details.role, 'member');
      assert.deepEqual(details.capabilities, { saveClubs: true, requestClubSite: true, editPages: false });
    });

    await t.test('sign-out, account choice persistence, and successful reset', async () => {
      const signOut = await authHandler(request('/api/auth/logout', originalSession, 'POST', origin), 'logout');
      assert.equal(signOut.status, 200);
      assert.equal(hasCleared(signOut, 'pcss-session'), true);
      assert.equal(hasCleared(signOut, 'pcss-flow'), true);
      const choice = cookie(signOut, 'pcss-choose-account');
      const afterSignOut = await start('/my', choice);
      assert.equal(afterSignOut.authorization.searchParams.get('prompt'), 'select_account');
      const cancel = await finish(afterSignOut, choice, 'error=access_denied');
      assert.equal(destination(cancel).searchParams.get('auth'), 'cancelled');
      assert.equal(hasCleared(cancel, 'pcss-choose-account'), false);
      const retry = await start('/my', choice);
      assert.equal(retry.authorization.searchParams.get('prompt'), 'select_account');
      const completed = await finish(retry, choice);
      assert.equal(hasCleared(completed, 'pcss-choose-account'), true);
    });

    await t.test('missing, mismatched, repeated, and provider-error callbacks', async () => {
      const noFlow = await authHandler(request('/api/auth/callback?code=test&state=unknown'), 'callback');
      assert.equal(destination(noFlow).searchParams.get('auth'), 'expired');
      const flow = await start('/my/clubs');
      const badState = await authHandler(request('/api/auth/callback?code=test&state=wrong', flow.flow), 'callback');
      assert.equal(destination(badState).searchParams.get('auth'), 'failed');
      const providerError = await finish(flow, '', 'error=server_error');
      assert.equal(destination(providerError).searchParams.get('auth'), 'failed');
      assert.equal(hasCleared(providerError, 'pcss-flow'), true);
      const completed = await finish(flow);
      assert.equal(destination(completed).pathname, '/my/clubs');
      const replay = await authHandler(request(`/api/auth/callback?code=test-code&state=${flow.authorization.searchParams.get('state')}`, cookie(completed, 'pcss-flow')), 'callback');
      assert.equal(destination(replay).searchParams.get('auth'), 'expired');
    });

    await t.test('school membership requires a verified matching email and hosted domain', async () => {
      for (const candidate of [
        { sub: 'unverified', email: 'student@pioneercss.org', email_verified: false, hd: 'pioneercss.org' },
        { sub: 'wrong-hd', email: 'student@pioneercss.org', email_verified: true, hd: 'other.edu' },
        { sub: 'wrong-email', email: 'student@other.edu', email_verified: true, hd: 'pioneercss.org' },
      ]) {
        identity = candidate;
        const flow = await start('/my');
        const result = await finish(flow);
        assert.equal(destination(result).searchParams.get('auth'), 'denied', candidate.sub);
        assert.equal(hasCleared(result, 'pcss-session'), true);
      }
    });
  } finally {
    globalThis.fetch = oldFetch;
    for (const key of Object.keys(process.env)) if (key.startsWith('OIDC_')) delete process.env[key];
    Object.assign(process.env, oldEnv);
  }
});
