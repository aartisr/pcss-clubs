const RETURN_BASE = 'https://pioneer-clubs.invalid';

/** Keep task destinations on this site, including their query and fragment. */
export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f]/.test(value)) return '/';
  try {
    const parsed = new URL(value, RETURN_BASE);
    return parsed.origin === RETURN_BASE ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/';
  } catch {
    return '/';
  }
}

/** Build the same-site sign-in route used by ordinary and account-switch actions. */
export function authStartPath(returnTo: string, chooseAccount = false): string {
  const params = new URLSearchParams({ returnTo: safeReturnTo(returnTo) });
  if (chooseAccount) params.set('chooseAccount', '1');
  return `/api/auth/start?${params}`;
}

type SignInSession = { status: 'loading' | 'ready' | 'error'; configured: boolean; authenticated: boolean };

/** A failed account check needs a fresh session result before any redirect. */
export async function signInDestination(current: SignInSession, retry: () => Promise<SignInSession | null>, returnTo: string): Promise<string | null> {
  const session = current.status === 'ready' && current.configured ? current : await retry();
  if (!session || session.status !== 'ready' || !session.configured) return null;
  const destination = safeReturnTo(returnTo);
  return session.authenticated ? destination : authStartPath(destination);
}
