import React, { lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRegistry } from '../context/RegistryContext';
import { pagePath, parseEditorPath } from '../puck/pageModel';
import { EditorLanding } from './EditorLanding';
import { AUTH_COPY } from '../data/authCopy';

const EditorPage = lazy(() => import('../pages/EditorPage').then((module) => ({ default: module.EditorPage })));

export function ProtectedEditorRoute() {
  const auth = useAuth();
  const location = useLocation();
  const { campuses } = useRegistry();
  if (auth.canEdit) return location.pathname === '/editor' ? <EditorLanding /> : <Suspense fallback={<p className="p-8">Opening editor…</p>}><EditorPage /></Suspense>;

  const publicPage = parseEditorPath(location.pathname, campuses);
  const returnPath = publicPage ? pagePath(publicPage) : '/';
  const loading = auth.status === 'loading';
  const signedInWithoutAccess = auth.status === 'ready' && auth.authenticated;
  const title = loading
    ? 'Checking your access…'
    : auth.status === 'error'
      ? auth.authIssue === 'origin' ? 'School sign-in needs a site fix' : 'Sign-in is temporarily unavailable'
      : !auth.configured
        ? 'School sign-in is unavailable'
        : signedInWithoutAccess
          ? 'Editing is unavailable for this account'
          : 'Sign in to edit this page';
  const detail = loading
    ? 'This will take a moment.'
    : auth.status === 'error'
      ? auth.authIssue === 'origin' ? 'This website’s address does not match its sign-in setup. The portal team needs to correct it. You can still browse clubs.' : 'Please try again. You can still browse the clubs.'
      : !auth.configured
        ? 'The portal team needs to check sign-in setup. You can try again or view the public page.'
        : signedInWithoutAccess
          ? `You're signed in${auth.user?.email ? ` as ${auth.user.email}` : ''}. Choose an account with editing access, or view the public page.`
          : 'Use an account with editing access to open the visual editor.';

  return (
    <main className="site-canvas min-h-screen bg-[#F8FAFC] dark:bg-[#071120] flex items-center justify-center p-4 sm:p-6">
      <section className="site-card w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0E1C33] p-5 sm:p-8" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-widest text-[#8B1E24] dark:text-[#FCA5A5]">{auth.authenticated ? 'Page editing' : 'PCSS Pioneer Clubs'}</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-[#0B2240] dark:text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{detail}</p>
        {auth.signInRetryFailed && <p role="alert" className="mt-4 rounded-xl border border-[#E8D7AA] bg-[#FFF9EA] p-3 text-sm leading-6 text-[#563B12] dark:border-[#70582B] dark:bg-[#292B31] dark:text-[#FFF0C2]">Sign-in is still unavailable. You can try again, view the public page, or contact the portal team.</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {auth.status === 'ready' && !auth.authenticated && (
            <button type="button" disabled={auth.signInPending} onClick={() => auth.signIn(location.pathname + location.search)} className="rounded-lg bg-[#8B1E24] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A61C24]">{auth.signInPending ? 'Checking sign-in…' : AUTH_COPY.signInWithSchool}</button>
          )}
          {signedInWithoutAccess && <button type="button" onClick={() => auth.useAnotherAccount(location.pathname + location.search)} className="rounded-lg bg-[#8B1E24] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A61C24]">{AUTH_COPY.switchSchoolAccount}</button>}
          {auth.status === 'error' && auth.authIssue !== 'origin' && (
            <button type="button" disabled={auth.signInPending} onClick={() => void auth.signIn(location.pathname + location.search)} className="rounded-lg bg-[#8B1E24] px-5 py-2.5 text-sm font-semibold text-white">{auth.signInPending ? 'Checking sign-in…' : AUTH_COPY.signInWithSchool}</button>
          )}
          <Link to={returnPath} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#0B2240] dark:text-white">{publicPage ? 'View this page' : 'Back to directory'}</Link>
          {(auth.status === 'error' || !auth.configured) && <Link to="/support#corrections" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#8B1E24] underline-offset-4 hover:underline dark:text-[#FCA5A5]">Contact the portal team</Link>}
        </div>
      </section>
    </main>
  );
}
