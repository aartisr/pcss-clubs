import { useAuth } from '../context/AuthContext';
import { AUTH_COPY } from '../data/authCopy';
import { AccountControl } from './AccountControl';

export function AuthNavControl({ mobile = false }: { mobile?: boolean }) {
  const auth = useAuth();
  if (auth.status === 'loading') return mobile
    ? <p role="status" className="px-3 py-2 text-sm">Checking your account…</p>
    : <span aria-label="Checking your account" className="hidden h-10 w-20 animate-pulse rounded-lg bg-white/10 xl:block" />;

  const className = mobile
    ? 'flex min-h-11 w-full items-center rounded-lg border border-slate-300 px-3 text-left text-sm font-semibold text-[#0B2240] dark:border-slate-600 dark:text-white'
    : 'hidden xl:inline-flex min-h-10 items-center rounded-lg border border-white/30 px-3 text-xs font-semibold text-white hover:bg-white/10';

  if (auth.authenticated) return <AccountControl user={auth.user ?? {}} canEdit={auth.canEdit} onSignOut={auth.signOut} onUseAnotherAccount={() => auth.useAnotherAccount('/my')} mobile={mobile} />;
  return <button type="button" disabled={auth.signInPending} onClick={() => void auth.signIn('/my')} className={className}>{auth.signInPending ? 'Checking sign-in…' : mobile ? AUTH_COPY.signInWithSchool : AUTH_COPY.signIn}</button>;
}
