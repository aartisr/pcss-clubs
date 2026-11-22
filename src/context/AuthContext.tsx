import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authStartPath, safeReturnTo, signInDestination } from '../shared/authReturn';
import { sessionFailureKind, type AuthIssue } from '../shared/authSession';

type Capabilities = { saveClubs: boolean; requestClubSite: boolean; editPages: boolean };
const noCapabilities: Capabilities = { saveClubs: false, requestClubSite: false, editPages: false };
type AuthState = { status: 'loading' | 'ready' | 'error'; configured: boolean; authenticated: boolean; canEdit: boolean; role: 'editor' | 'member' | null; capabilities: Capabilities; user: { name?: string; email?: string } | null };
type AuthContextValue = AuthState & { authIssue: AuthIssue; recentlySignedOut: boolean; signInPending: boolean; signInRetryFailed: boolean; dismissSignInRetryFailure: () => void; signIn: (returnTo?: string) => void; useAnotherAccount: (returnTo?: string) => void; signOut: () => Promise<boolean>; refresh: () => Promise<AuthState | null> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', configured: false, authenticated: false, canEdit: false, role: null, capabilities: noCapabilities, user: null });
  const [recentlySignedOut, setRecentlySignedOut] = useState(false);
  const [signInRetryFailed, setSignInRetryFailed] = useState(false);
  const [signInPending, setSignInPending] = useState(false);
  const [authIssue, setAuthIssue] = useState<AuthIssue>(null);
  const signInInFlight = useRef(false);
  const authRevision = useRef(0);
  const refresh = useCallback(async (): Promise<AuthState | null> => {
    const revision = authRevision.current;
    const fail = (issue: Exclude<AuthIssue, null>) => {
      if (revision === authRevision.current) {
        setAuthIssue(issue);
        setState({ status: 'error', configured: false, authenticated: false, canEdit: false, role: null, capabilities: noCapabilities, user: null });
      }
      return null;
    };
    try {
      const response = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        return fail(sessionFailureKind(response.status, detail));
      }
      const result = await response.json();
      if (!result || typeof result.configured !== 'boolean' || typeof result.authenticated !== 'boolean') return fail('invalid');
      if (revision !== authRevision.current) return null;
      const authenticated = result.authenticated === true;
      if (authenticated) setRecentlySignedOut(false);
      const next: AuthState = { status: 'ready', configured: result.configured === true, authenticated, canEdit: authenticated && result.canEdit === true, role: authenticated && (result.role === 'editor' || result.role === 'member') ? result.role : null, capabilities: authenticated ? { saveClubs: result.capabilities?.saveClubs === true, requestClubSite: result.capabilities?.requestClubSite === true, editPages: result.capabilities?.editPages === true } : noCapabilities, user: authenticated ? result.user ?? null : null };
      setState(next);
      setAuthIssue(null);
      if (next.configured) setSignInRetryFailed(false);
      return next;
    } catch { return fail('network'); }
  }, []);
  useEffect(() => {
    void refresh();
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 60_000);
    return () => { document.removeEventListener('visibilitychange', refreshWhenVisible); window.clearInterval(interval); };
  }, []);
  const signIn = useCallback(async (returnTo = window.location.pathname + window.location.search) => {
    if (signInInFlight.current) return;
    signInInFlight.current = true;
    setSignInPending(true);
    setRecentlySignedOut(false);
    setSignInRetryFailed(false);
    try {
      const destination = await signInDestination(state, refresh, returnTo);
      if (!destination) {
        setSignInRetryFailed(true);
        return;
      }
      window.location.assign(destination);
    } catch {
      setSignInRetryFailed(true);
    } finally {
      signInInFlight.current = false;
      setSignInPending(false);
    }
  }, [refresh, state]);
  const useAnotherAccount = useCallback((returnTo = '/my') => {
    setRecentlySignedOut(false);
    window.location.assign(authStartPath(safeReturnTo(returnTo), true));
  }, []);
  const signOut = useCallback(async () => {
    authRevision.current += 1;
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { Origin: window.location.origin }, credentials: 'same-origin' });
      if (!response.ok) throw new Error('Could not sign out');
      authRevision.current += 1;
      setRecentlySignedOut(true);
      setState({ status: 'ready', configured: true, authenticated: false, canEdit: false, role: null, capabilities: noCapabilities, user: null });
      if (window.location.pathname.startsWith('/editor/')) window.location.assign('/');
      return true;
    } catch {
      authRevision.current += 1;
      await refresh();
      return false;
    }
  }, [refresh]);
  return <AuthContext.Provider value={{ ...state, authIssue, recentlySignedOut, signInPending, signInRetryFailed, dismissSignInRetryFailure: () => setSignInRetryFailed(false), signIn, useAnotherAccount, signOut, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value && typeof window !== 'undefined') throw new Error('AuthProvider is missing');
  return value ?? { status: 'ready' as const, configured: false, authenticated: false, canEdit: false, role: null, capabilities: noCapabilities, user: null, authIssue: null, recentlySignedOut: false, signInPending: false, signInRetryFailed: false, dismissSignInRetryFailure: () => {}, signIn: () => {}, useAnotherAccount: () => {}, signOut: async () => false, refresh: async () => null };
}
