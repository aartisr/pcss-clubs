import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authHandler, getAuthConfig, safeReturnTo } from '../src/server/auth.ts';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { signInDestination } from '../src/shared/authReturn.ts';
import { sessionFailureKind } from '../src/shared/authSession.ts';
import { productionAuthIssues } from '../scripts/check-production-auth.ts';

function savedOidcEnv(): Record<string, string> {
  return Object.fromEntries(Object.entries(process.env).filter(([key, value]) => key.startsWith('OIDC_') && value !== undefined)) as Record<string, string>;
}

function clearOidcEnv(): void {
  for (const key of Object.keys(process.env)) if (key.startsWith('OIDC_')) delete process.env[key];
}

function restoreOidcEnv(saved: Record<string, string>): void {
  clearOidcEnv();
  Object.assign(process.env, saved);
}

test('missing provider configuration leaves editing disabled', async () => {
  assert.equal(getAuthConfig({} as NodeJS.ProcessEnv), null);
  const old = savedOidcEnv();
  clearOidcEnv();
  try {
    const response = await authHandler(new Request('http://localhost:3000/api/auth/session'), 'session');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { configured: false, authenticated: false, canEdit: false });
    const start = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fsupport%23request-club-site'), 'start');
    assert.equal(start.headers.get('location'), 'http://localhost:3000/my?auth=unavailable&returnTo=%2Fsupport%23request-club-site');
  } finally { restoreOidcEnv(old); }
});

test('session failures distinguish an origin mismatch from a transient service failure', () => {
  assert.equal(sessionFailureKind(400, { code: 'ORIGIN_MISMATCH' }), 'origin');
  assert.equal(sessionFailureKind(400, { error: 'Invalid application origin.' }), 'origin');
  assert.equal(sessionFailureKind(503, { error: 'Authentication is misconfigured.' }), 'service');
  assert.equal(sessionFailureKind(400, null), 'service');
});

test('production deployments fail before publishing when sign-in settings are missing or invalid', () => {
  const base = { VERCEL_ENV: 'production', OIDC_ISSUER: 'https://accounts.google.com', OIDC_CLIENT_ID: 'client', OIDC_CLIENT_SECRET: 'secret', OIDC_APP_ORIGIN: 'https://pcssclubs.org', OIDC_SESSION_SECRET: Buffer.alloc(32, 1).toString('base64url') } as NodeJS.ProcessEnv;
  assert.deepEqual(productionAuthIssues(base), []);
  assert.deepEqual(productionAuthIssues({ ...base, VERCEL_PROJECT_PRODUCTION_URL: 'pcssclubs.ai-aarti.com' }), []);
  assert.deepEqual(productionAuthIssues({ ...base, OIDC_CLIENT_ID: '' }), ['Missing Production environment variables: OIDC_CLIENT_ID.']);
  assert.match(productionAuthIssues({ ...base, OIDC_APP_ORIGIN: 'http://localhost:3000' })[0], /HTTPS production site origin/);
  assert.match(productionAuthIssues({ ...base, OIDC_SESSION_SECRET: 'weak' })[0], /invalid/);
  assert.deepEqual(productionAuthIssues({ VERCEL_ENV: 'preview' }), []);
});

test('login return paths reject external and malformed destinations', () => {
  assert.equal(safeReturnTo('//evil.example'), '/');
  assert.equal(safeReturnTo('https://evil.example'), '/');
  assert.equal(safeReturnTo('/\\evil.example'), '/');
  assert.equal(safeReturnTo('/editor/home'), '/editor/home');
  assert.equal(safeReturnTo('/support?from=club#request-club-site'), '/support?from=club#request-club-site');
});

test('failed account checks have a safe retry and never send a user to a broken sign-in route', async () => {
  const error = { status: 'error' as const, configured: false, authenticated: false };
  let retries = 0;
  assert.equal(await signInDestination(error, async () => { retries += 1; return null; }, '/editor/home'), null);
  assert.equal(retries, 1);
  assert.equal(await signInDestination(error, async () => ({ status: 'ready', configured: false, authenticated: false }), '/my'), null);
  assert.equal(await signInDestination({ status: 'ready', configured: false, authenticated: false }, async () => ({ status: 'ready', configured: true, authenticated: false }), '/my'), '/api/auth/start?returnTo=%2Fmy');
  assert.equal(await signInDestination(error, async () => ({ status: 'ready', configured: true, authenticated: false }), '/support#request-club-site'), '/api/auth/start?returnTo=%2Fsupport%23request-club-site');
  assert.equal(await signInDestination(error, async () => ({ status: 'ready', configured: true, authenticated: true }), '/editor/home'), '/editor/home');
  assert.equal(await signInDestination({ status: 'ready', configured: true, authenticated: false }, async () => { throw new Error('Should not retry a healthy session'); }, 'https://evil.example'), '/api/auth/start?returnTo=%2F');
});

test('config requires a strong session secret and explicit editor policy', () => {
  const base = { OIDC_ISSUER: 'https://identity.example', OIDC_CLIENT_ID: 'client', OIDC_CLIENT_SECRET: 'secret', OIDC_APP_ORIGIN: 'http://localhost:3000' };
  assert.throws(() => getAuthConfig({ ...base, OIDC_SESSION_SECRET: 'weak' } as NodeJS.ProcessEnv));
  const config = getAuthConfig({ ...base, OIDC_SESSION_SECRET: Buffer.alloc(32, 1).toString('base64url') } as NodeJS.ProcessEnv);
  assert.equal(config?.allowAll, false);
  assert.deepEqual(config?.allowedEmails, []);
});

test('logout requires same origin POST and rejects unconfigured requests', async () => {
  const old = savedOidcEnv();
  clearOidcEnv();
  try {
    const response = await authHandler(new Request('http://localhost:3000/api/auth/logout', { method: 'POST' }), 'logout');
    assert.equal(response.status, 503);
  } finally { restoreOidcEnv(old); }
});

test('OIDC flow assigns editor and member roles and rejects a tampered session', async () => {
  const originalEnv = savedOidcEnv();
  const originalFetch = globalThis.fetch;
  const issuer = 'https://identity.example/';
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'ES256', use: 'sig' };
  let nonce = '';
  let challenge = '';
  let hostedDomain: string | undefined = 'pioneercss.org';
  let tokenExchangeError: 'invalid_grant' | 'invalid_client' | null = null;
  let tokenSubject = 'person-1';
  let tokenEmail = 'editor@pioneercss.org';
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.endsWith('/.well-known/openid-configuration')) return Response.json({ issuer, authorization_endpoint: `${issuer}authorize`, token_endpoint: `${issuer}token`, jwks_uri: `${issuer}jwks`, response_types_supported: ['code'], id_token_signing_alg_values_supported: ['ES256'], token_endpoint_auth_methods_supported: ['client_secret_post'], code_challenge_methods_supported: ['S256'] });
    if (url.endsWith('/jwks')) return Response.json({ keys: [jwk] });
    if (url.endsWith('/token')) {
      if (tokenExchangeError) return Response.json({ error: tokenExchangeError }, { status: tokenExchangeError === 'invalid_client' ? 401 : 400 });
      const body = new URLSearchParams((init?.body as string) ?? '');
      assert.equal(body.get('grant_type'), 'authorization_code');
      assert.equal(body.get('client_id'), 'client');
      assert.equal(body.get('client_secret'), 'secret');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.get('code_verifier')!));
      assert.equal(Buffer.from(digest).toString('base64url'), challenge);
      const idToken = await new SignJWT({ nonce, name: 'School Editor', email: tokenEmail, email_verified: true, hd: hostedDomain })
        .setProtectedHeader({ alg: 'ES256', kid: 'test-key' }).setIssuer(issuer).setAudience('client').setSubject(tokenSubject).setIssuedAt().setExpirationTime('5m').sign(privateKey);
      return Response.json({ access_token: 'test-access-token', token_type: 'Bearer', expires_in: 300, id_token: idToken });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  clearOidcEnv();
  Object.assign(process.env, { OIDC_ISSUER: issuer.slice(0, -1), OIDC_CLIENT_ID: 'client', OIDC_CLIENT_SECRET: 'secret', OIDC_APP_ORIGIN: 'http://localhost:3000', OIDC_SESSION_SECRET: Buffer.alloc(32, 1).toString('base64url'), OIDC_ALLOWED_EMAILS: 'editor@pioneercss.org', OIDC_REQUIRED_HOSTED_DOMAIN: 'pioneercss.org' });
  try {
    const start = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Feditor%2Fhome'), 'start');
    assert.equal(start.status, 302);
    const authorization = new URL(start.headers.get('location')!);
    assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(authorization.searchParams.get('hd'), 'pioneercss.org');
    assert.equal(authorization.searchParams.get('redirect_uri'), 'http://localhost:3000/api/auth/callback');
    assert.equal(authorization.searchParams.has('prompt'), false);
    nonce = authorization.searchParams.get('nonce')!;
    challenge = authorization.searchParams.get('code_challenge')!;
    const flowCookie = start.headers.getSetCookie()[0].split(';')[0];
    const wrongState = await authHandler(new Request('http://localhost:3000/api/auth/callback?code=test-code&state=wrong', { headers: { Cookie: flowCookie } }), 'callback');
    assert.equal(wrongState.status, 302);
    assert.equal(wrongState.headers.get('location'), 'http://localhost:3000/my?auth=failed');
    assert.equal(wrongState.headers.getSetCookie().some((cookie) => cookie.startsWith('pcss-flow=')), false);
    const cancelled = await authHandler(new Request(`http://localhost:3000/api/auth/callback?error=access_denied&state=${encodeURIComponent(authorization.searchParams.get('state')!)}`, { headers: { Cookie: flowCookie } }), 'callback');
    assert.equal(cancelled.headers.get('location'), 'http://localhost:3000/my?auth=cancelled&returnTo=%2Feditor%2Fhome');
    const missingFlow = await authHandler(new Request('http://localhost:3000/api/auth/callback?code=test-code&state=unknown'), 'callback');
    assert.equal(missingFlow.headers.get('location'), 'http://localhost:3000/my?auth=expired');
    const callbackUrl = `http://localhost:3000/api/auth/callback?code=test-code&state=${encodeURIComponent(authorization.searchParams.get('state')!)}`;
    const callback = await authHandler(new Request(callbackUrl, { headers: { Cookie: flowCookie } }), 'callback');
    assert.equal(callback.status, 302);
    assert.equal(callback.headers.get('location'), 'http://localhost:3000/editor/home');
    const sessionCookie = callback.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-session='))!.split(';')[0];
    const firstTab = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fsupport%23request-club-site'), 'start');
    const firstTabAuthorization = new URL(firstTab.headers.get('location')!);
    const firstTabFlow = firstTab.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-flow='))!.split(';')[0];
    const secondTab = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fmy%2Fclubs', { headers: { Cookie: firstTabFlow } }), 'start');
    const secondTabAuthorization = new URL(secondTab.headers.get('location')!);
    const combinedFlow = secondTab.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-flow='))!.split(';')[0];
    nonce = firstTabAuthorization.searchParams.get('nonce')!;
    challenge = firstTabAuthorization.searchParams.get('code_challenge')!;
    const firstTabCallback = await authHandler(new Request(`http://localhost:3000/api/auth/callback?code=test-code&state=${firstTabAuthorization.searchParams.get('state')}`, { headers: { Cookie: combinedFlow } }), 'callback');
    assert.equal(firstTabCallback.headers.get('location'), 'http://localhost:3000/support#request-club-site');
    const remainingFlow = firstTabCallback.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-flow='))!.split(';')[0];
    nonce = secondTabAuthorization.searchParams.get('nonce')!;
    challenge = secondTabAuthorization.searchParams.get('code_challenge')!;
    const secondTabCallback = await authHandler(new Request(`http://localhost:3000/api/auth/callback?code=test-code&state=${secondTabAuthorization.searchParams.get('state')}`, { headers: { Cookie: remainingFlow } }), 'callback');
    assert.equal(secondTabCallback.headers.get('location'), 'http://localhost:3000/my/clubs');
    const session = await authHandler(new Request('http://localhost:3000/api/auth/session', { headers: { Cookie: sessionCookie } }), 'session');
    const editorSession = await session.json();
    assert.equal(editorSession.role, 'editor');
    assert.deepEqual(editorSession.capabilities, { saveClubs: true, requestClubSite: true, editPages: true });
    const alreadySignedIn = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fmy', { headers: { Cookie: sessionCookie } }), 'start');
    assert.equal(alreadySignedIn.status, 302);
    assert.equal(alreadySignedIn.headers.get('location'), 'http://localhost:3000/my');
    assert.equal(alreadySignedIn.headers.getSetCookie().length, 0);
    const switchStart = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fmy&chooseAccount=1', { headers: { Cookie: sessionCookie } }), 'start');
    const switchAuthorization = new URL(switchStart.headers.get('location')!);
    assert.equal(switchAuthorization.searchParams.get('prompt'), 'select_account');
    assert.equal(switchStart.headers.getSetCookie().some((cookie) => cookie.startsWith('pcss-session=;')), false);
    nonce = switchAuthorization.searchParams.get('nonce')!;
    challenge = switchAuthorization.searchParams.get('code_challenge')!;
    tokenSubject = 'person-2';
    tokenEmail = 'student@pioneercss.org';
    const switchFlowCookie = switchStart.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-flow='))!.split(';')[0];
    const switchCallback = await authHandler(new Request(`http://localhost:3000/api/auth/callback?code=test-code&state=${switchAuthorization.searchParams.get('state')}`, { headers: { Cookie: `${sessionCookie}; ${switchFlowCookie}` } }), 'callback');
    assert.equal(switchCallback.headers.get('location'), 'http://localhost:3000/my');
    const newSessionCookie = switchCallback.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-session='))!.split(';')[0];
    const newSession = await authHandler(new Request('http://localhost:3000/api/auth/session', { headers: { Cookie: newSessionCookie } }), 'session');
    assert.equal((await newSession.json()).user.email, 'student@pioneercss.org');
    tokenSubject = 'person-1';
    tokenEmail = 'editor@pioneercss.org';
    process.env.OIDC_ALLOWED_EMAILS = 'another-editor@pioneercss.org';
    const revoked = await authHandler(new Request('http://localhost:3000/api/auth/session', { headers: { Cookie: sessionCookie } }), 'session');
    assert.deepEqual(await revoked.json(), { configured: true, authenticated: true, canEdit: false, role: 'member', capabilities: { saveClubs: true, requestClubSite: true, editPages: false }, user: { name: 'School Editor', email: 'editor@pioneercss.org' } });
    process.env.OIDC_ALLOWED_EMAILS = 'editor@pioneercss.org';
    process.env.OIDC_REQUIRED_HOSTED_DOMAIN = 'other-school.edu';
    const wrongDomain = await authHandler(new Request('http://localhost:3000/api/auth/session', { headers: { Cookie: sessionCookie } }), 'session');
    const rejectedDomain = await wrongDomain.json();
    assert.equal(rejectedDomain.authenticated, false);
    assert.deepEqual(rejectedDomain.capabilities, { saveClubs: false, requestClubSite: false, editPages: false });
    process.env.OIDC_REQUIRED_HOSTED_DOMAIN = 'pioneercss.org';
    const [sessionName, sessionValue] = sessionCookie.split('=');
    const tampered = `${sessionName}=${sessionValue[0] === 'A' ? 'B' : 'A'}${sessionValue.slice(1)}`;
    const rejected = await authHandler(new Request('http://localhost:3000/api/auth/session', { headers: { Cookie: tampered } }), 'session');
    assert.equal((await rejected.json()).canEdit, false);
    const logout = await authHandler(new Request('http://localhost:3000/api/auth/logout', { method: 'POST', headers: { Origin: 'http://localhost:3000', Cookie: sessionCookie } }), 'logout');
    assert.equal(logout.status, 200);
    assert.match(logout.headers.getSetCookie().join('; '), /pcss-session=;[^;]*;[^;]*;[^;]*; Max-Age=0/);
    const accountChoiceCookie = logout.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-choose-account='))!.split(';')[0];
    const afterLogoutStart = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fmy', { headers: { Cookie: accountChoiceCookie } }), 'start');
    const afterLogoutAuthorization = new URL(afterLogoutStart.headers.get('location')!);
    assert.equal(afterLogoutAuthorization.searchParams.get('prompt'), 'select_account');
    assert.equal(afterLogoutStart.headers.getSetCookie().some((cookie) => cookie.startsWith('pcss-choose-account=')), false);
    const afterLogoutFlow = afterLogoutStart.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-flow='))!.split(';')[0];
    const cancelledChoice = await authHandler(new Request(`http://localhost:3000/api/auth/callback?error=access_denied&state=${afterLogoutAuthorization.searchParams.get('state')}`, { headers: { Cookie: `${accountChoiceCookie}; ${afterLogoutFlow}` } }), 'callback');
    assert.equal(cancelledChoice.headers.getSetCookie().some((cookie) => cookie.startsWith('pcss-choose-account=;')), false);
    const retryChoice = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fmy', { headers: { Cookie: accountChoiceCookie } }), 'start');
    const retryAuthorization = new URL(retryChoice.headers.get('location')!);
    assert.equal(retryAuthorization.searchParams.get('prompt'), 'select_account');
    nonce = retryAuthorization.searchParams.get('nonce')!;
    challenge = retryAuthorization.searchParams.get('code_challenge')!;
    const retryFlow = retryChoice.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-flow='))!.split(';')[0];
    const retryCallback = await authHandler(new Request(`http://localhost:3000/api/auth/callback?code=test-code&state=${retryAuthorization.searchParams.get('state')}`, { headers: { Cookie: `${accountChoiceCookie}; ${retryFlow}` } }), 'callback');
    assert.equal(retryCallback.headers.getSetCookie().some((cookie) => cookie.startsWith('pcss-choose-account=;') && cookie.includes('Max-Age=0')), true);
    const failedStart = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fsupport%23request-club-site'), 'start');
    const failedAuthorization = new URL(failedStart.headers.get('location')!);
    const failedFlowCookie = failedStart.headers.getSetCookie()[0].split(';')[0];
    tokenExchangeError = 'invalid_grant';
    const failureLogs: unknown[][] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => { failureLogs.push(args); };
    let failedCallback: Response;
    try {
      failedCallback = await authHandler(new Request(`http://localhost:3000/api/auth/callback?code=test-code&state=${failedAuthorization.searchParams.get('state')}`, { headers: { Cookie: failedFlowCookie } }), 'callback');
    } finally {
      console.error = originalConsoleError;
    }
    assert.deepEqual(failureLogs, [['[pcss-auth] sign-in failed', { action: 'callback', phase: 'token-exchange', kind: 'provider-response', status: 400, providerCode: 'invalid_grant' }]]);
    assert.equal(failedCallback.headers.get('location'), 'http://localhost:3000/my?auth=failed&returnTo=%2Fsupport%23request-club-site');
    assert.equal(failedCallback.headers.getSetCookie().some((cookie) => cookie.startsWith('pcss-flow=;')), true);
    tokenExchangeError = 'invalid_client';
    const setupStart = await authHandler(new Request('http://localhost:3000/api/auth/start'), 'start');
    const setupAuthorization = new URL(setupStart.headers.get('location')!);
    const setupFlowCookie = setupStart.headers.getSetCookie()[0].split(';')[0];
    const setupCallback = await authHandler(new Request(`http://localhost:3000/api/auth/callback?code=test-code&state=${setupAuthorization.searchParams.get('state')}`, { headers: { Cookie: setupFlowCookie } }), 'callback');
    assert.equal(setupCallback.headers.get('location'), 'http://localhost:3000/my?auth=setup&returnTo=%2F');
    tokenExchangeError = null;
    hostedDomain = undefined;
    const deniedSwitchStart = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Fmy&chooseAccount=1', { headers: { Cookie: sessionCookie } }), 'start');
    const deniedSwitchAuthorization = new URL(deniedSwitchStart.headers.get('location')!);
    assert.equal(deniedSwitchAuthorization.searchParams.get('prompt'), 'select_account');
    nonce = deniedSwitchAuthorization.searchParams.get('nonce')!;
    challenge = deniedSwitchAuthorization.searchParams.get('code_challenge')!;
    const deniedSwitchFlow = deniedSwitchStart.headers.getSetCookie().find((cookie) => cookie.startsWith('pcss-flow='))!.split(';')[0];
    const deniedSwitchCallback = await authHandler(new Request(`http://localhost:3000/api/auth/callback?code=test-code&state=${deniedSwitchAuthorization.searchParams.get('state')}`, { headers: { Cookie: `${sessionCookie}; ${deniedSwitchFlow}` } }), 'callback');
    assert.equal(deniedSwitchCallback.headers.get('location'), 'http://localhost:3000/my?auth=switch-denied');
    assert.equal(deniedSwitchCallback.headers.getSetCookie().some((cookie) => cookie.startsWith('pcss-session=')), false);
    const secondStart = await authHandler(new Request('http://localhost:3000/api/auth/start?returnTo=%2Feditor%2Fhome'), 'start');
    const secondAuthorization = new URL(secondStart.headers.get('location')!);
    nonce = secondAuthorization.searchParams.get('nonce')!;
    challenge = secondAuthorization.searchParams.get('code_challenge')!;
    const secondCookie = secondStart.headers.getSetCookie()[0].split(';')[0];
    const secondCallback = await authHandler(new Request(`http://localhost:3000/api/auth/callback?code=test-code&state=${secondAuthorization.searchParams.get('state')}`, { headers: { Cookie: secondCookie } }), 'callback');
    assert.equal(secondCallback.headers.get('location'), 'http://localhost:3000/my?auth=denied&returnTo=%2Feditor%2Fhome');
    assert.equal(secondCallback.headers.getSetCookie().some((cookie) => cookie.startsWith('pcss-session=;') && cookie.includes('Max-Age=0')), true);
  } finally {
    globalThis.fetch = originalFetch;
    restoreOidcEnv(originalEnv);
  }
});
