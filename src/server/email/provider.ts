export interface EmailMessage {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}

export type ProviderHint = 'permission-denied' | 'ip-blocked' | 'key-rejected' | 'key-inactive';

function providerHint(message: unknown): ProviderHint | undefined {
  if (typeof message !== 'string') return undefined;
  if (/\bip(?: address)?\b/i.test(message) && /\b(?:block(?:ed|ing)?|denied|not authorized|unauthori[sz]ed|unknown|allowlist|whitelist)\b/i.test(message)) return 'ip-blocked';
  if (/access denied for resource|(?:insufficient|missing|required) permission/i.test(message)) return 'permission-denied';
  if (/\b(?:api key|key)\b/i.test(message) && /\b(?:invalid|unknown|not found|not recognized)\b/i.test(message)) return 'key-rejected';
  if (/\b(?:api key|key)\b/i.test(message) && /\b(?:deactivated|inactive|expired|revoked)\b/i.test(message)) return 'key-inactive';
  return undefined;
}

export class EmailDeliveryError extends Error {
  constructor(
    public readonly kind: 'rate-limited' | 'configuration' | 'unavailable',
    public readonly status?: number,
    public readonly providerCode?: string,
    public readonly retryAfterSeconds?: number,
    public readonly providerHint?: ProviderHint,
  ) {
    super(kind);
  }
}

export function retryAfterSeconds(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  const value = Number.isFinite(seconds) ? seconds : (Date.parse(header) - Date.now()) / 1000;
  return Number.isFinite(value) && value > 0 ? Math.min(Math.ceil(value), 86400) : undefined;
}

export async function deliveryError(response: Response): Promise<EmailDeliveryError> {
  let providerCode: string | undefined;
  let hint: ProviderHint | undefined;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const data = body as Record<string, unknown>;
      const code = typeof data.code === 'string' ? data.code : typeof data.name === 'string' ? data.name : undefined;
      if (code && /^[a-z0-9_-]{1,60}$/i.test(code)) providerCode = code;
      hint = providerHint(data.message);
    }
  } catch { /* Provider returned no structured error. */ }
  const limited = response.status === 429 || providerCode === 'not_enough_credits' || providerCode === 'daily_quota_exceeded' || providerCode === 'monthly_quota_exceeded';
  const configuration = [400, 401, 402, 403].includes(response.status) && providerCode !== 'duplicate_request'
    || ['unauthorized', 'permission_denied', 'account_under_validation'].includes(providerCode ?? '');
  return new EmailDeliveryError(limited ? 'rate-limited' : configuration ? 'configuration' : 'unavailable', response.status, providerCode, retryAfterSeconds(response.headers.get('retry-after')), hint);
}
