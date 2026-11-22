import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { AUTH_COPY } from '../../data/authCopy';
import { useAuth } from '../../context/AuthContext';
import { authOutcomeMessage } from '../../data/authOutcome';
import { CLUB_SITE_REQUEST_EMAIL } from '../../data/supportCenter';

const signInHelpEmail = `mailto:${CLUB_SITE_REQUEST_EMAIL}?subject=${encodeURIComponent('Pioneer Clubs sign-in problem')}`;

type GuestAccessChoiceProps = {
  status: 'ready' | 'error';
  configured: boolean;
  recentlySignedOut: boolean;
  onSignIn: () => void;
};

export function GuestAccessChoice({ status, configured, recentlySignedOut, onSignIn }: GuestAccessChoiceProps) {
  const auth = useAuth();
  const location = useLocation();
  const result = new URLSearchParams(location.search).get('auth');
  const callbackDetail = authOutcomeMessage(result);
  const originMismatch = auth.authIssue === 'origin';
  const setupIssue = result === 'setup';
  const detail = originMismatch
    ? 'This website’s sign-in address does not match its setup. The portal team needs to correct it before you can sign in. You can still browse clubs.'
    : callbackDetail ?? (auth.signInRetryFailed
    ? status === 'ready' && !configured
      ? 'School sign-in is unavailable on this site right now. The portal team needs to check its setup. You can try again or tell us what happened.'
      : 'We could not check school sign-in right now. Try again, or keep browsing clubs. The portal team can help if it continues.'
    : status === 'error'
    ? 'We could not check school sign-in right now. Try signing in again, or keep browsing clubs. If it keeps happening, visit Support.'
    : recentlySignedOut
      ? 'To save clubs again, sign in with a PCSS school account. Google and Chrome may still remember your previous account.'
      : configured
        ? 'A PCSS school account lets you save clubs and request a club website.'
        : 'School sign-in is unavailable on this site right now. You can try again or contact the portal team.');

  return (
    <section className="site-card max-w-xl rounded-3xl border border-[#E2E8F0] bg-white p-5 dark:border-[#1E3A5F] dark:bg-[#0E1C33] sm:p-9">
      <LockKeyhole className="h-8 w-8 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
      <h1 className="mt-4 font-display text-3xl font-bold text-[#0B2240] dark:text-white">{recentlySignedOut ? 'You’re signed out' : 'Explore clubs your way'}</h1>
      <p className="mt-3 text-sm leading-6 text-[#475569] dark:text-slate-300">Club pages, campus information, and the directory are open to everyone. You can keep browsing without signing in.</p>
      <p className="mt-2 text-sm leading-6 text-[#475569] dark:text-slate-300">{detail}</p>
      {auth.signInRetryFailed && <p role="alert" className="mt-4 rounded-xl border border-[#E8D7AA] bg-[#FFF9EA] p-3 text-sm font-semibold leading-6 text-[#563B12] dark:border-[#70582B] dark:bg-[#292B31] dark:text-[#FFF0C2]">{originMismatch ? 'Retrying cannot fix this site setting. Please email the portal team using the link below.' : 'Sign-in is still unavailable. Please email the portal team if it continues.'}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link to="/" className="site-action inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2240] px-5 py-2.5 text-sm font-semibold text-white dark:bg-[#8B1E24] sm:w-auto">Browse clubs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        {!originMismatch && !setupIssue && <button type="button" disabled={auth.signInPending} onClick={result === 'denied' || result === 'switch-denied' ? () => auth.useAnotherAccount(location.pathname) : onSignIn} className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-center text-sm font-semibold text-[#0B2240] hover:border-[#8B1E24] dark:border-[#4B6383] dark:text-white sm:w-auto">{auth.signInPending ? 'Checking sign-in…' : result === 'denied' || result === 'switch-denied' ? 'Choose an account' : auth.signInRetryFailed ? 'Try sign-in again' : AUTH_COPY.signInWithSchool}</button>}
        {(status === 'error' || !configured || auth.signInRetryFailed || result === 'unavailable' || setupIssue) && <a href={signInHelpEmail} className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-[#8B1E24] underline-offset-4 hover:underline dark:text-[#FCA5A5] sm:w-auto">Email the portal team</a>}
      </div>
    </section>
  );
}
