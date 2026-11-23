import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const endpoint = 'https://api.brevo.com/v3/account';

export type BrevoConnectionResult =
  | { ok: true }
  | { ok: false; reason: 'missing-key' | 'unauthorized' | 'forbidden' | 'rate-limited' | 'provider-error' | 'network-error'; status?: number };

/** Read-only credential check. Never sends mail or returns account details. */
export async function checkBrevoConnection(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): Promise<BrevoConnectionResult> {
  const apiKey = env.BREVO_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: 'missing-key' };
  let response: Response;
  try {
    response = await fetcher(endpoint, {
      method: 'GET',
      headers: { 'api-key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
  } catch { return { ok: false, reason: 'network-error' }; }
  if (response.ok) return { ok: true };
  const reason = response.status === 401 ? 'unauthorized'
    : response.status === 403 ? 'forbidden'
      : response.status === 429 ? 'rate-limited' : 'provider-error';
  return { ok: false, reason, status: response.status };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkBrevoConnection();
  if (result.ok) {
    console.log('Brevo API key accepted. No email was sent.');
  } else {
    const advice = {
      'missing-key': 'BREVO_API_KEY is not set in this environment.',
      unauthorized: 'Brevo rejected BREVO_API_KEY. Use a Brevo v3 API key for the deployed environment, then redeploy.',
      forbidden: 'Brevo denied this API key. Check its account permissions and any IP restrictions.',
      'rate-limited': 'Brevo is rate limiting account checks. Try again later.',
      'provider-error': 'Brevo returned an unexpected error. Check its status page and account settings.',
      'network-error': 'Could not reach Brevo. Check network access and try again.',
    }[result.reason];
    console.error(`Brevo connection check failed${result.status ? ` (${result.status})` : ''}: ${advice}`);
    process.exitCode = 1;
  }
}
