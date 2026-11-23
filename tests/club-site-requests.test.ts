import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { authHandler } from '../src/server/auth.ts';
import { clubSiteRequestHandler } from '../src/server/clubSiteRequests.ts';
import { BrevoEmailProvider } from '../src/server/email/brevo.ts';
import { ResendEmailProvider } from '../src/server/email/resend.ts';
import { EmailDeliveryError } from '../src/server/email/provider.ts';
import { getEmailSettings } from '../src/server/email/config.ts';
import { emailConfigIssues } from '../scripts/check-email-config.ts';

const origin = 'http://localhost:3000';
const requestPath = `${origin}/api/club-site-requests`;
const submissionId = '2a5e30e9-71de-4b84-88f8-21bca25076bc';
const form = { clubName: 'Robotics Team', campusSlug: 'pcss2', clubStatus: 'unsure', advisorName: '', purpose: 'Share meetings and projects.', submissionId };
const env = {
  OIDC_ISSUER: 'https://identity.example', OIDC_CLIENT_ID: 'client', OIDC_CLIENT_SECRET: 'secret',
  OIDC_APP_ORIGIN: origin, OIDC_SESSION_SECRET: Buffer.alloc(32, 9).toString('base64url'),
  OIDC_REQUIRED_HOSTED_DOMAIN: 'pioneercss.org', EMAIL_PROVIDER: 'brevo',
  BREVO_API_KEY: 'test-server-only-key', BREVO_SENDER_EMAIL: 'requests@pcssclubs.org',
};

function submission(cookie = '', body: unknown = form, requestOrigin = origin): Request {
  return new Request(requestPath, {
    method: 'POST', headers: { Origin: requestOrigin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
}

test('email provider configuration is server-only and fails closed', () => {
  assert.equal(getEmailSettings({} as NodeJS.ProcessEnv), null);
  assert.throws(() => getEmailSettings({ EMAIL_PROVIDER: 'unknown' } as NodeJS.ProcessEnv));
  assert.throws(() => getEmailSettings({ EMAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'key', BREVO_SENDER_EMAIL: 'bad' } as NodeJS.ProcessEnv));
  assert.equal(getEmailSettings(env as NodeJS.ProcessEnv)?.recipient, 'pcss2robotics@pioneercss.org');
  assert.equal(getEmailSettings({ ...env, EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'resend-test', EMAIL_SENDER_EMAIL: 'requests@pcssclubs.org', BREVO_SENDER_EMAIL: '' } as NodeJS.ProcessEnv)?.providerName, 'resend');
  assert.throws(() => getEmailSettings({ ...env, EMAIL_PROVIDER: 'resend', RESEND_API_KEY: '' } as NodeJS.ProcessEnv));
  assert.deepEqual(emailConfigIssues({} as NodeJS.ProcessEnv), []);
  assert.deepEqual(emailConfigIssues(env as NodeJS.ProcessEnv), []);
  assert.equal(emailConfigIssues({ EMAIL_PROVIDER: 'brevo' } as NodeJS.ProcessEnv).length, 1);
});

test('Brevo adapter sends one plain-text message with a stable idempotency header', async () => {
  let calls = 0;
  const provider = new BrevoEmailProvider('private-key', async (input, init) => {
    calls += 1;
    assert.equal(input, 'https://api.brevo.com/v3/smtp/email');
    assert.equal((init?.headers as Record<string, string>)['api-key'], 'private-key');
    const payload = JSON.parse(String(init?.body));
    assert.deepEqual(payload.to, [{ email: 'pcss2robotics@pioneercss.org' }]);
    assert.equal(payload.sender.email, 'requests@pcssclubs.org');
    assert.equal(payload.replyTo.email, 'student@pioneercss.org');
    assert.equal(payload.headers.IdempotencyKey, submissionId);
    assert.equal(payload.textContent, 'Request details');
    assert.equal(payload.htmlContent, undefined);
    return Response.json({ messageId: 'brevo-message-1' }, { status: 201 });
  });
  assert.deepEqual(await provider.send({ to: 'pcss2robotics@pioneercss.org', from: 'requests@pcssclubs.org', replyTo: 'student@pioneercss.org', subject: 'Request', text: 'Request details', idempotencyKey: submissionId }), { messageId: 'brevo-message-1' });
  assert.equal(calls, 1);
  const rateLimited = new BrevoEmailProvider('key', async () => new Response('', { status: 429 }));
  await assert.rejects(() => rateLimited.send({ to: 'a@b.org', from: 'c@d.org', replyTo: 'e@f.org', subject: 'x', text: 'x', idempotencyKey: submissionId }), (error) => error instanceof EmailDeliveryError && error.kind === 'rate-limited');
  const malformed = new BrevoEmailProvider('key', async () => Response.json({}, { status: 201 }));
  await assert.rejects(() => malformed.send({ to: 'a@b.org', from: 'c@d.org', replyTo: 'e@f.org', subject: 'x', text: 'x', idempotencyKey: submissionId }), EmailDeliveryError);
  const credits = new BrevoEmailProvider('key', async () => Response.json({ code: 'not_enough_credits' }, { status: 402 }));
  await assert.rejects(() => credits.send({ to: 'a@b.org', from: 'c@d.org', replyTo: 'e@f.org', subject: 'x', text: 'x', idempotencyKey: submissionId }), (error) => error instanceof EmailDeliveryError && error.kind === 'rate-limited' && error.providerCode === 'not_enough_credits');
});

test('Resend adapter preserves the common contract and interprets provider limits', async () => {
  const message = { to: 'admin@example.org', from: 'requests@example.org', replyTo: 'student@example.org', subject: 'Request', text: 'Details', idempotencyKey: submissionId };
  const provider = new ResendEmailProvider('resend-secret', async (input, init) => {
    assert.equal(input, 'https://api.resend.com/emails');
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer resend-secret');
    assert.equal((init?.headers as Record<string, string>)['Idempotency-Key'], submissionId);
    assert.deepEqual(JSON.parse(String(init?.body)), { from: 'Pioneer Clubs <requests@example.org>', to: ['admin@example.org'], reply_to: 'student@example.org', subject: 'Request', text: 'Details', tags: [{ name: 'category', value: 'club-site-request' }] });
    return Response.json({ id: 'resend-message-1' }, { status: 200 });
  });
  assert.deepEqual(await provider.send(message), { messageId: 'resend-message-1' });
  const limit = new ResendEmailProvider('key', async () => Response.json({ name: 'daily_quota_exceeded' }, { status: 429, headers: { 'Retry-After': '60' } }));
  await assert.rejects(() => limit.send(message), (error) => error instanceof EmailDeliveryError && error.kind === 'rate-limited' && error.retryAfterSeconds === 60);
  const unavailable = new ResendEmailProvider('key', async () => { throw new Error('Network error'); });
  await assert.rejects(() => unavailable.send(message), (error) => error instanceof EmailDeliveryError && error.kind === 'unavailable');
});

test('request endpoint rejects unconfigured, unsigned, cross-site, and malformed submissions', async () => {
  const sender = async () => { throw new Error('Should not call provider'); };
  assert.deepEqual(await (await clubSiteRequestHandler(new Request(requestPath), {} as NodeJS.ProcessEnv, sender)).json(), { available: false });
  assert.deepEqual(await (await clubSiteRequestHandler(new Request(requestPath), env as NodeJS.ProcessEnv, sender)).json(), { available: true });
  assert.deepEqual(await (await clubSiteRequestHandler(new Request(requestPath), { ...env, OIDC_REQUIRED_HOSTED_DOMAIN: '' } as NodeJS.ProcessEnv, sender)).json(), { available: false });
  assert.equal((await clubSiteRequestHandler(submission(), {} as NodeJS.ProcessEnv, sender)).status, 503);
  assert.equal((await clubSiteRequestHandler(submission(), env as NodeJS.ProcessEnv, sender)).status, 401);
  assert.equal((await clubSiteRequestHandler(submission('', form, 'https://other.example'), env as NodeJS.ProcessEnv, sender)).status, 403);
  assert.equal((await clubSiteRequestHandler(new Request(requestPath, { method: 'PUT' }), env as NodeJS.ProcessEnv, sender)).status, 405);
});

test('signed-in request sends through Brevo, isolates identity, and recovers from provider failures', async () => {
  const oldEnv = { ...process.env };
  const oldFetch = globalThis.fetch;
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'ES256', use: 'sig' };
  let nonce = '';
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.endsWith('/.well-known/openid-configuration')) return Response.json({ issuer: 'https://identity.example/', authorization_endpoint: 'https://identity.example/authorize', token_endpoint: 'https://identity.example/token', jwks_uri: 'https://identity.example/jwks', response_types_supported: ['code'], id_token_signing_alg_values_supported: ['ES256'], token_endpoint_auth_methods_supported: ['client_secret_post'], code_challenge_methods_supported: ['S256'] });
    if (url.endsWith('/jwks')) return Response.json({ keys: [jwk] });
    if (url.endsWith('/token')) {
      const idToken = await new SignJWT({ nonce, name: 'School Student', email: 'student@pioneercss.org', email_verified: true, hd: 'pioneercss.org' }).setProtectedHeader({ alg: 'ES256', kid: 'test-key' }).setIssuer('https://identity.example/').setAudience('client').setSubject('student-1').setIssuedAt().setExpirationTime('5m').sign(privateKey);
      return Response.json({ access_token: 'token', token_type: 'Bearer', expires_in: 300, id_token: idToken });
    }
    throw new Error('Unexpected OIDC request');
  };
  for (const key of Object.keys(process.env)) if (key.startsWith('OIDC_')) delete process.env[key];
  Object.assign(process.env, env);
  try {
    const started = await authHandler(new Request(`${origin}/api/auth/start`), 'start');
    const authorization = new URL(started.headers.get('location')!);
    nonce = authorization.searchParams.get('nonce')!;
    const flow = started.headers.getSetCookie()[0].split(';')[0];
    const callback = await authHandler(new Request(`${origin}/api/auth/callback?code=code&state=${authorization.searchParams.get('state')}`, { headers: { Cookie: flow } }), 'callback');
    const cookie = callback.headers.getSetCookie().find((item) => item.startsWith('pcss-session='))!.split(';')[0];
    const sent: Array<Record<string, unknown>> = [];
    const send = async (_input: RequestInfo | URL, init?: RequestInit) => {
      sent.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return Response.json({ messageId: 'brevo-1' }, { status: 201 });
    };
    const first = await clubSiteRequestHandler(submission(cookie), env as NodeJS.ProcessEnv, send);
    assert.equal(first.status, 202);
    const receipt = await first.json();
    assert.match(receipt.requestId, /^PCR-[0-9A-F]{8}$/);
    assert.equal(receipt.notificationStatus, 'accepted');
    const second = await clubSiteRequestHandler(submission(cookie), env as NodeJS.ProcessEnv, send);
    assert.equal((await second.json()).requestId, receipt.requestId);
    assert.equal(sent.length, 2);
    assert.equal((sent[0].headers as Record<string, string>).IdempotencyKey, (sent[1].headers as Record<string, string>).IdempotencyKey);
    assert.equal((sent[0].replyTo as Record<string, string>).email, 'student@pioneercss.org');
    assert.match(String(sent[0].textContent), /Requested by: School Student <student@pioneercss.org>/);
    assert.equal((sent[0].to as Array<{email: string}>)[0].email, 'pcss2robotics@pioneercss.org');
    const switched = await clubSiteRequestHandler(submission(cookie, { ...form, submissionId: '38a591b3-2f3f-4f82-afcc-98f32ca3c028' }), {
      ...env, EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 'resend-test', EMAIL_SENDER_EMAIL: 'requests@pcssclubs.org', BREVO_SENDER_EMAIL: '',
    } as NodeJS.ProcessEnv, async (_input, init) => {
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer resend-test');
      return Response.json({ id: 'resend-1' }, { status: 200 });
    });
    assert.equal(switched.status, 202);
    for (const bad of [
      { ...form, requesterEmail: 'attacker@example.com' },
      { ...form, campusSlug: 'other' },
      { ...form, clubName: 'Bad\nSubject' },
      { ...form, purpose: '' },
      { ...form, submissionId: 'not-a-uuid' },
    ]) assert.equal((await clubSiteRequestHandler(submission(cookie, bad), env as NodeJS.ProcessEnv, send)).status, 400);
    assert.equal(sent.length, 2);
    assert.equal((await clubSiteRequestHandler(submission(cookie), { ...env, EMAIL_PROVIDER: '' } as NodeJS.ProcessEnv, send)).status, 503);
    const limited = await clubSiteRequestHandler(submission(cookie), env as NodeJS.ProcessEnv, async () => new Response('', { status: 429, headers: { 'Retry-After': '120' } }));
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('retry-after'), '120');
    assert.deepEqual(await limited.json(), { code: 'EMAIL_LIMIT_REACHED' });
    assert.equal((await clubSiteRequestHandler(submission(cookie), env as NodeJS.ProcessEnv, async () => new Response('', { status: 500 }))).status, 503);
  } finally {
    globalThis.fetch = oldFetch;
    for (const key of Object.keys(process.env)) if (key.startsWith('OIDC_') || key.startsWith('BREVO_') || key.startsWith('RESEND_') || key === 'EMAIL_PROVIDER' || key === 'EMAIL_SENDER_EMAIL') delete process.env[key];
    Object.assign(process.env, oldEnv);
  }
});
