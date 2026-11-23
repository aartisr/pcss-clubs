import { createHmac } from 'node:crypto';
import { getAuthConfig, schoolMemberSession } from './auth.js';
import { getEmailSettings } from './email/config.js';
import { EmailDeliveryError } from './email/provider.js';
import { INITIAL_CAMPUSES } from '../data/registry.js';
import { formatClubSiteRequestEmail, type ClubSiteRequestDraft } from '../data/supportCenter.js';

const MAX_BODY_BYTES = 4096;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses = ['approved', 'seeking-approval', 'unsure'];
type Fields = { clubName: string; campusSlug: string; clubStatus: ClubSiteRequestDraft['clubStatus']; advisorName: string; purpose: string; submissionId: string };

function reply(status: number, data: object, retryAfterSeconds?: number): Response {
  return Response.json(data, { status, headers: {
    'Cache-Control': 'no-store', Vary: 'Cookie, Origin',
    ...(retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {}),
  } });
}

async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) return null;
      chunks.push(value);
    }
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch { return null; }
  finally { reader.releaseLock(); }
}

function validFields(value: unknown): Fields | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const keys = ['clubName', 'campusSlug', 'clubStatus', 'advisorName', 'purpose', 'submissionId'];
  if (Object.keys(data).some((key) => !keys.includes(key))) return null;
  if (keys.some((key) => typeof data[key] !== 'string')) return null;
  const clubName = (data.clubName as string).trim();
  const campusSlug = data.campusSlug as string;
  const clubStatus = data.clubStatus as Fields['clubStatus'];
  const advisorName = (data.advisorName as string).trim();
  const purpose = (data.purpose as string).trim();
  const submissionId = data.submissionId as string;
  if (!clubName || clubName.length > 100 || /[\r\n\x00-\x1f]/.test(clubName)) return null;
  if (!INITIAL_CAMPUSES.some((campus) => campus.slug === campusSlug)) return null;
  if (!statuses.includes(clubStatus)) return null;
  if (advisorName.length > 100 || /[\r\n\x00-\x1f]/.test(advisorName)) return null;
  if (!purpose || purpose.length > 700 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(purpose)) return null;
  if (!uuid.test(submissionId)) return null;
  return { clubName, campusSlug, clubStatus, advisorName, purpose, submissionId };
}

function requestKey(secret: Buffer, subject: string, fields: Fields): string {
  const hex = createHmac('sha256', secret).update(subject).update('\0').update(JSON.stringify(fields)).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function clubSiteRequestHandler(request: Request, env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method === 'GET') {
    try { return reply(200, { available: Boolean(getAuthConfig(env)?.requiredHostedDomain && getEmailSettings(env, fetcher)) }); }
    catch { return reply(200, { available: false }); }
  }
  if (request.method !== 'POST') return reply(405, { code: 'METHOD_NOT_ALLOWED' });
  let auth: ReturnType<typeof getAuthConfig>;
  try { auth = getAuthConfig(env); } catch { return reply(503, { code: 'SIGN_IN_UNAVAILABLE' }); }
  if (!auth?.requiredHostedDomain) return reply(503, { code: 'SIGN_IN_UNAVAILABLE' });
  const origin = new URL(request.url).origin;
  if (origin !== auth.origin || request.headers.get('origin') !== auth.origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return reply(403, { code: 'INVALID_ORIGIN' });
  }
  const member = schoolMemberSession(request, auth);
  if (!member) return reply(401, { code: 'SIGN_IN_REQUIRED' });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reply(415, { code: 'INVALID_CONTENT_TYPE' });
  const fields = validFields(await readJson(request));
  if (!fields) return reply(400, { code: 'INVALID_REQUEST' });
  let email: ReturnType<typeof getEmailSettings>;
  try { email = getEmailSettings(env, fetcher); } catch { return reply(503, { code: 'EMAIL_UNAVAILABLE' }); }
  if (!email) return reply(503, { code: 'EMAIL_UNAVAILABLE' });
  const campus = INITIAL_CAMPUSES.find((item) => item.slug === fields.campusSlug)!;
  const key = requestKey(auth.key, member.sub, fields);
  const requestId = `PCR-${key.slice(0, 8).toUpperCase()}`;
  const content = formatClubSiteRequestEmail({
    requesterName: member.name,
    requesterEmail: member.email,
    clubName: fields.clubName,
    campusName: campus.name,
    clubStatus: fields.clubStatus,
    advisorName: fields.advisorName,
    purpose: fields.purpose,
  }, requestId);
  try {
    const delivery = await email.provider.send({
      to: email.recipient,
      from: email.sender,
      replyTo: member.email,
      subject: content.subject,
      text: content.text,
      idempotencyKey: key,
    });
    console.info('[club-site-request] accepted', { requestId, provider: email.providerName, messageId: delivery.messageId });
    return reply(202, { requestId, notificationStatus: 'accepted' });
  } catch (error) {
    console.error('[club-site-request] delivery failed', {
      requestId, provider: email.providerName,
      kind: error instanceof EmailDeliveryError ? error.kind : 'unexpected',
      status: error instanceof EmailDeliveryError ? error.status : undefined,
      providerCode: error instanceof EmailDeliveryError ? error.providerCode : undefined,
    });
    if (error instanceof EmailDeliveryError && error.kind === 'rate-limited') return reply(429, { code: 'EMAIL_LIMIT_REACHED' }, error.retryAfterSeconds);
    return reply(503, { code: 'EMAIL_UNAVAILABLE' });
  }
}
