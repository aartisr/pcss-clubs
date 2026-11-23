import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { deliveryError, type ProviderHint } from '../src/server/email/provider.js';

const endpoint = 'https://api.brevo.com/v3/smtp/statistics/aggregatedReport?days=1';

export type BrevoConnectionResult =
  | { ok: true }
  | { ok: false; reason: 'missing-key' | 'unauthorized' | 'forbidden' | 'rate-limited' | 'provider-error' | 'network-error'; status?: number; providerHint?: ProviderHint };

/** Read-only transactional-email check. Never sends mail or returns account details. */
export async function checkBrevoConnection(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): Promise<BrevoConnectionResult> {
  const apiKey = env.BREVO_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: 'missing-key' };
  let response: Response;
  try {
    response = await fetcher(endpoint, {
      method: 'GET',
      headers: { 'api-key': apiKey, Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
  } catch { return { ok: false, reason: 'network-error' }; }
  if (response.ok) return { ok: true };
  const reason = response.status === 401 ? 'unauthorized'
    : response.status === 403 ? 'forbidden'
      : response.status === 429 ? 'rate-limited' : 'provider-error';
  const error = await deliveryError(response);
  return { ok: false, reason, status: response.status, ...(error.providerHint ? { providerHint: error.providerHint } : {}) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkBrevoConnection();
  if (result.ok) {
    console.log('Brevo transactional API read request accepted. Sending still requires Transactional email: All. No email was sent.');
  } else {
    const advice = {
      'missing-key': 'BREVO_API_KEY is not set in this environment.',
      unauthorized: 'Brevo rejected the API call. Check Transactional email: All, the key status, and API IP restrictions.',
      forbidden: 'Brevo denied this API key. Check Transactional email: All and API IP restrictions.',
      'rate-limited': 'Brevo is rate limiting account checks. Try again later.',
      'provider-error': 'Brevo returned an unexpected error. Check its status page and account settings.',
      'network-error': 'Could not reach Brevo. Check network access and try again.',
    }[result.reason];
    console.error(`Brevo connection check failed${result.status ? ` (${result.status})` : ''}${result.providerHint ? ` [${result.providerHint}]` : ''}: ${advice}`);
    process.exitCode = 1;
  }
}
