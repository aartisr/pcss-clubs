import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import * as oidc from 'openid-client';
import { safeReturnTo } from '../shared/authReturn.js';
export { safeReturnTo } from '../shared/authReturn.js';

type Identity = { sub: string; name?: string; email?: string; emailVerified?: boolean; hostedDomain?: string; issuer: string; exp: number };
type Transaction = { verifier: string; state: string; nonce: string; returnTo: string; switching?: boolean; exp: number };
type TransactionStore = { flows: Transaction[]; exp: number };
type AuthConfig = { issuer: string; clientId: string; clientSecret: string; clientAuthMethod: 'post' | 'basic'; origin: string; key: Buffer; allowedSubjects: string[]; allowedEmails: string[]; requiredHostedDomain?: string; allowAll: boolean };

const SESSION_SECONDS = 8 * 60 * 60;
const TRANSACTION_SECONDS = 5 * 60;
const cleanList = (value?: string) => value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
const normalizedIssuer = (value: string) => value.replace(/\/$/, '');

export function getAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig | null {
  const { OIDC_ISSUER: issuer, OIDC_CLIENT_ID: clientId, OIDC_CLIENT_SECRET: clientSecret, OIDC_APP_ORIGIN: origin, OIDC_SESSION_SECRET: secret } = env;
  if (![issuer, clientId, clientSecret, origin, secret].every(Boolean)) return null;
  const issuerUrl = new URL(issuer!);
  const originUrl = new URL(origin!);
  if (issuerUrl.protocol !== 'https:' || (originUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(originUrl.hostname)) || originUrl.origin !== originUrl.href.replace(/\/$/, '')) {
    throw new Error('OIDC_ISSUER must use HTTPS and OIDC_APP_ORIGIN must be an origin on HTTPS or localhost.');
  }
  const key = Buffer.from(secret!, 'base64url');
  if (key.length !== 32) throw new Error('OIDC_SESSION_SECRET must contain 32 random bytes encoded as base64url.');
  const clientAuthMethod = env.OIDC_CLIENT_AUTH_METHOD ?? 'post';
  if (clientAuthMethod !== 'post' && clientAuthMethod !== 'basic') throw new Error('OIDC_CLIENT_AUTH_METHOD must be post or basic.');
  const requiredHostedDomain = env.OIDC_REQUIRED_HOSTED_DOMAIN?.trim().toLowerCase() || undefined;
  if (requiredHostedDomain && !/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/.test(requiredHostedDomain)) throw new Error('OIDC_REQUIRED_HOSTED_DOMAIN must be a domain name.');
  return { issuer: normalizedIssuer(issuerUrl.href), clientId: clientId!, clientSecret: clientSecret!, clientAuthMethod, origin: originUrl.origin, key, allowedSubjects: cleanList(env.OIDC_ALLOWED_SUBJECTS), allowedEmails: cleanList(env.OIDC_ALLOWED_EMAILS).map((email) => email.toLowerCase()), requiredHostedDomain, allowAll: env.OIDC_EDIT_POLICY === 'authenticated' };
}

function seal(value: Identity | Transaction | TransactionStore, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}

function open<T extends { exp: number }>(token: string | undefined, key: Buffer): T | null {
  if (!token) return null;
  try {
    const data = Buffer.from(token, 'base64url');
    if (data.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const value = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString()) as T;
    return Number.isFinite(value.exp) && value.exp > Date.now() ? value : null;
  } catch { return null; }
}

function cookieValue(request: Request, name: string): string | undefined {
  return request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function cookieName(config: AuthConfig, kind: 'session' | 'flow' | 'choose-account'): string {
  return `${config.origin.startsWith('https:') ? '__Host-' : ''}pcss-${kind}`;
}

function setCookie(config: AuthConfig, kind: 'session' | 'flow' | 'choose-account', value: string, maxAge: number): string {
  return `${cookieName(config, kind)}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${config.origin.startsWith('https:') ? '; Secure' : ''}`;
}

function activeFlows(request: Request, config: AuthConfig): Transaction[] {
  const stored = open<Transaction | TransactionStore>(cookieValue(request, cookieName(config, 'flow')), config.key);
  const candidates = stored && 'flows' in stored ? stored.flows : stored ? [stored] : [];
  return Array.isArray(candidates)
    ? candidates.filter((flow): flow is Transaction => Boolean(flow && typeof flow.state === 'string' && typeof flow.verifier === 'string' && typeof flow.nonce === 'string' && typeof flow.returnTo === 'string' && Number.isFinite(flow.exp) && flow.exp > Date.now())).slice(-4)
    : [];
}

function flowCookie(config: AuthConfig, flows: Transaction[]): string {
  const active = flows.filter((flow) => flow.exp > Date.now()).slice(-4);
  const value = active.length ? seal({ flows: active, exp: Math.max(...active.map((flow) => flow.exp)) }, config.key) : '';
  return setCookie(config, 'flow', value, active.length ? TRANSACTION_SECONDS : 0);
}

function json(data: object, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } });
}

function recordAuthFailure(action: 'start' | 'callback', phase: string, error?: unknown): void {
  const detail: Record<string, string | number> = { action, phase };
  if (error instanceof oidc.ResponseBodyError) {
    detail.kind = 'provider-response';
    detail.status = error.status;
    detail.providerCode = ['invalid_client', 'invalid_grant', 'unauthorized_client', 'temporarily_unavailable'].includes(error.error)
      ? error.error : 'other';
  } else if (error instanceof oidc.ClientError) {
    detail.kind = 'oidc-validation';
    detail.code = error.code && /^[A-Z_]{1,50}$/.test(error.code) ? error.code : 'other';
  } else if (error instanceof TypeError) {
    detail.kind = 'network-or-type';
  } else if (error !== undefined) {
    detail.kind = 'unexpected';
  }
  // Never log the callback URL, state, code, cookies, tokens, or provider error descriptions.
  console.error('[pcss-auth] sign-in failed', detail);
}

function unavailableSignIn(request: Request): Response {
  const destination = new URL('/my', request.url);
  destination.searchParams.set('auth', 'unavailable');
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get('returnTo'));
  if (returnTo !== '/my') destination.searchParams.set('returnTo', returnTo);
  return new Response(null, { status: 302, headers: { Location: destination.href, 'Cache-Control': 'no-store' } });
}

type SignInIssue = 'denied' | 'switch-denied' | 'expired' | 'cancelled' | 'failed' | 'unavailable' | 'setup';

function signInResult(config: AuthConfig, issue: SignInIssue, returnTo = '/my', updatedFlows?: Transaction[]): Response {
  const destination = new URL('/my', config.origin);
  destination.searchParams.set('auth', issue);
  if (returnTo !== '/my') destination.searchParams.set('returnTo', safeReturnTo(returnTo));
  const response = new Response(null, { status: 302, headers: { Location: destination.href, 'Cache-Control': 'no-store' } });
  if (updatedFlows) response.headers.append('Set-Cookie', flowCookie(config, updatedFlows));
  return response;
}

function canEdit(identity: Identity, config: AuthConfig): boolean {
  if (config.requiredHostedDomain && identity.hostedDomain?.toLowerCase() !== config.requiredHostedDomain) return false;
  return config.allowAll || config.allowedSubjects.includes(identity.sub) || Boolean(identity.emailVerified && identity.email && config.allowedEmails.includes(identity.email.toLowerCase()));
}

function isSchoolMember(identity: Identity, config: AuthConfig): boolean {
  const domain = config.requiredHostedDomain;
  return Boolean(domain && identity.emailVerified && identity.hostedDomain?.toLowerCase() === domain && identity.email?.toLowerCase().endsWith(`@${domain}`));
}

export function schoolMemberSession(request: Request, config: AuthConfig): { sub: string; name: string; email: string } | null {
  const identity = session(request, config);
  return identity && isSchoolMember(identity, config) && identity.email
    ? { sub: identity.sub, name: identity.name || 'School member', email: identity.email }
    : null;
}

function session(request: Request, config: AuthConfig): Identity | null {
  const identity = open<Identity>(cookieValue(request, cookieName(config, 'session')), config.key);
  return identity && normalizedIssuer(identity.issuer) === config.issuer && (canEdit(identity, config) || isSchoolMember(identity, config)) ? identity : null;
}

export async function authHandler(request: Request, action: 'start' | 'callback' | 'session' | 'logout'): Promise<Response> {
  let config: AuthConfig | null;
  try { config = getAuthConfig(); } catch { return action === 'start' || action === 'callback' ? unavailableSignIn(request) : json({ error: 'Authentication is misconfigured.' }, 503); }
  if (!config) return action === 'start' || action === 'callback' ? unavailableSignIn(request) : json({ configured: false, authenticated: false, canEdit: false }, action === 'session' ? 200 : 503);
  const url = new URL(request.url);
  if (url.origin !== config.origin) return json({ code: 'ORIGIN_MISMATCH', error: 'Invalid application origin.', requestOrigin: url.origin, configuredOrigin: config.origin }, 400);

  if (action === 'session') {
    const identity = session(request, config);
    const editor = Boolean(identity && canEdit(identity, config));
    return json({ configured: true, authenticated: Boolean(identity), canEdit: editor, role: identity ? editor ? 'editor' : 'member' : null, capabilities: { saveClubs: Boolean(identity?.email), requestClubSite: Boolean(identity && isSchoolMember(identity, config)), editPages: editor }, user: identity ? { name: identity.name, email: identity.email } : null });
  }
  if (action === 'logout') {
    if (request.method !== 'POST' || request.headers.get('origin') !== config.origin) return json({ error: 'Invalid logout request.' }, 403);
    const response = json({ ok: true });
    response.headers.append('Set-Cookie', setCookie(config, 'session', '', 0));
    response.headers.append('Set-Cookie', setCookie(config, 'flow', '', 0));
    response.headers.append('Set-Cookie', setCookie(config, 'choose-account', '1', 30 * 24 * 60 * 60));
    return response;
  }
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

  const chooseAccount = action === 'start' && (url.searchParams.get('chooseAccount') === '1' || cookieValue(request, cookieName(config, 'choose-account')) === '1');
  if (action === 'start' && !chooseAccount && session(request, config)) {
    return new Response(null, { status: 302, headers: { Location: new URL(safeReturnTo(url.searchParams.get('returnTo')), config.origin).href, 'Cache-Control': 'no-store' } });
  }

  let attemptedReturnTo = action === 'start' ? safeReturnTo(url.searchParams.get('returnTo')) : '/my';
  let remainingFlows: Transaction[] | undefined;
  let phase = 'discovery';
  try {
    const clientAuth = config.clientAuthMethod === 'basic' ? oidc.ClientSecretBasic(config.clientSecret) : oidc.ClientSecretPost(config.clientSecret);
    const client = await oidc.discovery(new URL(config.issuer), config.clientId, config.clientSecret, clientAuth);
    const redirectUri = `${config.origin}/api/auth/callback`;
    if (action === 'start') {
      phase = 'authorization-request';
      const flow: Transaction = { verifier: oidc.randomPKCECodeVerifier(), state: oidc.randomState(), nonce: oidc.randomNonce(), returnTo: safeReturnTo(url.searchParams.get('returnTo')), switching: Boolean(chooseAccount && session(request, config)), exp: Date.now() + TRANSACTION_SECONDS * 1000 };
      const authorization = oidc.buildAuthorizationUrl(client, { redirect_uri: redirectUri, scope: 'openid profile email', response_type: 'code', code_challenge: await oidc.calculatePKCECodeChallenge(flow.verifier), code_challenge_method: 'S256', state: flow.state, nonce: flow.nonce, ...(config.requiredHostedDomain ? { hd: config.requiredHostedDomain } : {}), ...(chooseAccount ? { prompt: 'select_account' } : {}) });
      const response = new Response(null, { status: 302, headers: { Location: authorization.href, 'Cache-Control': 'no-store' } });
      response.headers.append('Set-Cookie', flowCookie(config, [...activeFlows(request, config), flow]));
      return response;
    }
    const flows = activeFlows(request, config);
    const flow = flows.find((candidate) => candidate.state === url.searchParams.get('state'));
    if (!flow) {
      recordAuthFailure('callback', cookieValue(request, cookieName(config, 'flow')) ? flows.length ? 'state-mismatch' : 'flow-cookie-invalid-or-expired' : 'flow-cookie-missing');
      return signInResult(config, flows.length ? 'failed' : 'expired');
    }
    remainingFlows = flows.filter((candidate) => candidate.state !== flow.state);
    attemptedReturnTo = flow.returnTo;
    if (url.searchParams.has('error')) {
      if (url.searchParams.get('error') !== 'access_denied') recordAuthFailure('callback', 'provider-authorization-error');
      return signInResult(config, url.searchParams.get('error') === 'access_denied' ? 'cancelled' : 'failed', attemptedReturnTo, remainingFlows);
    }
    phase = 'token-exchange';
    const tokens = await oidc.authorizationCodeGrant(client, url, { pkceCodeVerifier: flow.verifier, expectedState: flow.state, expectedNonce: flow.nonce });
    phase = 'identity-validation';
    const claims = tokens.claims();
    if (!claims?.sub || normalizedIssuer(claims.iss) !== config.issuer) throw new Error('Invalid identity token.');
    const identity: Identity = { sub: claims.sub, issuer: claims.iss, name: typeof claims.name === 'string' ? claims.name : undefined, email: typeof claims.email === 'string' ? claims.email : undefined, emailVerified: claims.email_verified === true, hostedDomain: typeof claims.hd === 'string' ? claims.hd : undefined, exp: Date.now() + SESSION_SECONDS * 1000 };
    const permitted = canEdit(identity, config) || isSchoolMember(identity, config);
    const previousSession = flow.switching ? session(request, config) : null;
    if (!permitted) {
      const response = signInResult(config, previousSession ? 'switch-denied' : 'denied', attemptedReturnTo, remainingFlows);
      if (!previousSession) response.headers.append('Set-Cookie', setCookie(config, 'session', '', 0));
      return response;
    }
    const response = new Response(null, { status: 302, headers: { Location: new URL(flow.returnTo, config.origin).href, 'Cache-Control': 'no-store' } });
    response.headers.append('Set-Cookie', flowCookie(config, remainingFlows));
    response.headers.append('Set-Cookie', setCookie(config, 'session', seal(identity, config.key), SESSION_SECONDS));
    if (cookieValue(request, cookieName(config, 'choose-account')) === '1') response.headers.append('Set-Cookie', setCookie(config, 'choose-account', '', 0));
    return response;
  } catch (error) {
    recordAuthFailure(action, phase, error);
    const clientRejected = phase === 'token-exchange' && error instanceof oidc.ResponseBodyError
      && error.status === 401 && error.error === 'invalid_client';
    return signInResult(config, clientRejected ? 'setup' : 'failed', attemptedReturnTo, remainingFlows);
  }
}
