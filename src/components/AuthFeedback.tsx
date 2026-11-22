import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { safeReturnTo } from '../shared/authReturn';
import { authOutcomeMessage } from '../data/authOutcome';

export function AuthFeedback() {
  const noticeRef = useRef<HTMLElement>(null);
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const result = new URLSearchParams(location.search).get('auth');
  const rawReturnTo = new URLSearchParams(location.search).get('returnTo');
  const returnTo = rawReturnTo ? safeReturnTo(rawReturnTo) : '/my';
  // My space already provides the recovery choices in its main content.
  const retryIssue = auth.signInRetryFailed && !location.pathname.startsWith('/my');
  const message = auth.authIssue === 'origin' && (retryIssue || result)
    ? 'This website’s sign-in address does not match its setup. The portal team must correct it before sign-in can work.'
    : retryIssue
      ? auth.status === 'ready' && !auth.configured
      ? 'School sign-in is unavailable on this site right now. You can try again, browse clubs, or get help.'
      : 'We could not check school sign-in right now. You can try again, browse clubs, or get help.'
    : authOutcomeMessage(result);
  useEffect(() => {
    if (retryIssue) noticeRef.current?.scrollIntoView({ block: 'start' });
  }, [retryIssue]);
  if (location.pathname.startsWith('/my') && !auth.authenticated) return null;
  if (!message) return null;

  const dismiss = () => {
    auth.dismissSignInRetryFailure();
    const params = new URLSearchParams(location.search);
    params.delete('auth');
    params.delete('returnTo');
    navigate(`${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`, { replace: true });
  };
  const canRetry = auth.authIssue !== 'origin' && (retryIssue || (result !== 'unavailable' && result !== 'setup' && auth.status === 'ready' && auth.configured));
  const chooseAccount = !retryIssue && (result === 'denied' || result === 'switch-denied' || auth.authenticated);

  return (
    <section ref={noticeRef} role="alert" aria-label="Sign-in update" className="scroll-mt-16 border-b border-[#E8D7AA] bg-[#FFF9EA] text-[#563B12] dark:border-[#70582B] dark:bg-[#292B31] dark:text-[#FFF0C2]">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm sm:items-center sm:px-6">
        <CircleAlert className="mt-1 h-5 w-5 shrink-0 text-[#8B1E24] sm:mt-0 dark:text-[#FCA5A5]" aria-hidden="true" />
        <div className="min-w-0 flex-1 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
          <p className="max-w-2xl leading-6 font-medium">{message}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 sm:gap-x-5">
          {canRetry && <button type="button" disabled={auth.signInPending} onClick={() => chooseAccount ? auth.useAnotherAccount(returnTo) : void auth.signIn(returnTo)} className="min-h-11 font-bold underline underline-offset-2">{auth.signInPending ? 'Checking sign-in…' : chooseAccount ? 'Choose an account' : 'Try sign-in again'}</button>}
          <Link to="/" onClick={auth.dismissSignInRetryFailure} className="inline-flex min-h-11 items-center font-bold underline underline-offset-2">Browse public clubs</Link>
          {(retryIssue || result === 'unavailable' || result === 'setup' || auth.authIssue === 'origin') && <Link to="/support#corrections" onClick={auth.dismissSignInRetryFailure} className="inline-flex min-h-11 items-center font-bold underline underline-offset-2">Contact the portal team</Link>}
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss sign-in message" className="mt-1 rounded-lg p-2 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-0 dark:hover:bg-white/10"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </section>
  );
}
