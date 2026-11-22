import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRegistry } from '../context/RegistryContext';
import { useSavedClubs } from '../context/SavedClubsContext';
import { SiteShell } from '../components/SiteShell';
import { buildCampusPath } from '../middleware/tenantRouting';
import { usePageMetadata } from '../hooks/usePageMetadata';
import type { Club } from '../data/registry';
import { MemberSchedule } from '../components/member/MemberSchedule';
import { MemberClubList } from '../components/member/MemberClubList';
import { MemberNextStep } from '../components/member/MemberNextStep';
import { AUTH_COPY } from '../data/authCopy';
import { GuestAccessChoice } from '../components/member/GuestAccessChoice';

export function MySpacePage({ view = 'home' }: { view?: 'home' | 'clubs' | 'schedule' }) {
  const auth = useAuth();
  const { campuses, clubs } = useRegistry();
  const { savedClubIds, storageError, toggleSaved } = useSavedClubs();
  const firstName = auth.user?.name?.trim().split(/\s+/)[0] || 'there';
  const canSaveClubs = auth.capabilities.saveClubs;
  const savedClubs = savedClubIds.map((id) => clubs.find((club) => club.id === id)).filter((club): club is Club => Boolean(club));

  const viewPath = view === 'home' ? '/my' : `/my/${view}`;
  usePageMetadata({ title: `${view === 'home' ? 'My space' : view === 'clubs' ? 'My clubs' : 'My schedule'} | Pioneer Clubs`, description: 'Your private starting point for exploring Pioneer Clubs.', canonicalPath: viewPath, indexable: false });

  return (
    <SiteShell>
      <main className="w-full max-w-6xl mx-auto flex-1 px-4 sm:px-6 py-10 sm:py-14">
        {auth.status === 'loading' ? (
          <p className="text-[#475569] dark:text-slate-300">Checking your account…</p>
        ) : !auth.authenticated ? (
          <GuestAccessChoice status={auth.status} configured={auth.configured} recentlySignedOut={auth.recentlySignedOut} onSignIn={() => void auth.signIn(viewPath)} />
        ) : (
          <>
            <div className="site-hero overflow-hidden rounded-3xl bg-[#0B2240] px-6 py-10 sm:px-10 sm:py-12 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">{AUTH_COPY.mySpace}</p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold">{view === 'home' ? `Welcome, ${firstName}` : view === 'clubs' ? 'My clubs' : 'My schedule'}</h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-slate-200">{view === 'home' ? 'Save clubs you want to explore, then see them in your weekly plan.' : view === 'clubs' ? 'Your saved clubs in one place.' : 'See when your saved clubs plan to meet.'}</p>
            </div>

            <nav aria-label="My space sections" className="mt-6 mb-7 flex flex-wrap gap-2">
              {([['home', 'Overview', '/my'], ['clubs', 'My clubs', '/my/clubs'], ['schedule', 'My schedule', '/my/schedule']] as const).map(([key, label, path]) => <Link key={key} to={path} aria-current={view === key ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold ${view === key ? 'bg-[#0B2240] text-white dark:bg-[#8B1E24]' : 'border border-[#CBD5E1] text-[#0B2240] dark:text-white'}`}>{label}</Link>)}
            </nav>

            {view === 'schedule' && <MemberSchedule clubs={savedClubs} />}
            {view === 'home' && <MemberNextStep savedCount={savedClubs.length} />}
            {view !== 'schedule' && <MemberClubList clubs={savedClubs} campuses={campuses} onRemove={toggleSaved} storageError={storageError} canSave={canSaveClubs} />}

            {view === 'home' && <section aria-labelledby="request-site-heading" className="site-card mt-8 flex flex-col gap-4 rounded-3xl border border-[#D4AF37]/50 bg-white p-6 dark:bg-[#0E1C33] sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D7] text-[#8B1E24] dark:bg-[#26364A] dark:text-[#F7D46B]"><UsersRound className="h-5 w-5" aria-hidden="true" /></span><div><h2 id="request-site-heading" className="font-display text-xl font-bold text-[#0B2240] dark:text-white">A page for your team?</h2><p className="mt-1 max-w-xl text-sm leading-6 text-[#475569] dark:text-slate-300">Share your club idea and what students should find on its website. Requests are reviewed before any page goes public.</p></div></div>
              <Link to="/support#request-club-site" className="site-action inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B2240] px-5 py-3 text-sm font-semibold text-white dark:bg-[#8B1E24]">Request a club website <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </section>}

            {view === 'home' && <section aria-labelledby="explore-campus-heading" className="mt-8">
              <h2 id="explore-campus-heading" className="font-display text-xl font-bold text-[#0B2240] dark:text-white">Explore a campus</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {campuses.map((campus) => <Link key={campus.id} to={buildCampusPath(campus.slug)} className="site-card site-card-interactive group rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#0E1C33] p-5 hover:border-[#8B1E24] dark:hover:border-[#FCA5A5]">
                  <p className="font-display text-lg font-bold text-[#0B2240] dark:text-white">{campus.name}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#8B1E24] dark:text-[#FCA5A5]">Browse clubs <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </Link>)}
              </div>
            </section>}
          </>
        )}
      </main>
    </SiteShell>
  );
}
