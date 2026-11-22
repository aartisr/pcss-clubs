import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Mail, User } from 'lucide-react';
import { CAMPUS_THEME_TOKENS } from '../data/registry';
import { useRegistry } from '../context/RegistryContext';
import { useAuth } from '../context/AuthContext';
import { useSavedClubs } from '../context/SavedClubsContext';
import { PublicPageRenderer } from '../puck/PublicPageRenderer';
import {
  buildCampusPath,
  buildClubPath,
  buildEditorPath,
} from '../middleware/tenantRouting';
import { SiteShell } from '../components/SiteShell';
import { SaveClubButton } from '../components/SaveClubButton';
import { PUBLIC_CONTENT_VERIFIED } from '../data/publication';
import { usePageMetadata } from '../hooks/usePageMetadata';

interface ClubSitePageProps {
  forcedCampusSlug?: string;
  forcedClubSlug?: string;
}

export function ClubSitePage({
  forcedCampusSlug,
  forcedClubSlug,
}: ClubSitePageProps) {
  const params = useParams<{
    campusSlug?: string;
    clubSlug?: string;
    tenant?: string;
  }>();

  // Support both /sites/:campusSlug/:clubSlug and /sites/:tenant (e.g. robotics-pcss1)
  let resolvedCampus = forcedCampusSlug || params.campusSlug;
  let resolvedClub = forcedClubSlug || params.clubSlug;

  if (!resolvedCampus && !resolvedClub && params.tenant) {
    const raw = params.tenant.toLowerCase();
    if (raw.includes('.')) {
      const [clubPart, campusPart] = raw.split('.');
      resolvedClub = clubPart;
      resolvedCampus = campusPart;
    } else if (raw.includes('-')) {
      const idx = raw.lastIndexOf('-');
      resolvedClub = raw.slice(0, idx);
      resolvedCampus = raw.slice(idx + 1);
    }
  }

  const { campuses, clubs, getCampusBySlug, getClubBySlugs, getPuckLayout } =
    useRegistry();
  const auth = useAuth();
  const { storageError, isSaved, toggleSaved } = useSavedClubs();

  const campus = resolvedCampus ? getCampusBySlug(resolvedCampus) : undefined;
  const club =
    resolvedCampus && resolvedClub
      ? getClubBySlugs(resolvedCampus, resolvedClub)
      : undefined;

  usePageMetadata({
    title: club && campus
      ? `${club.name} | ${campus.shortName} | Pioneer Clubs`
      : 'Club Page Unavailable | Pioneer Clubs',
    description: club && campus
      ? PUBLIC_CONTENT_VERIFIED
        ? `${club.shortDescription} Explore meeting details at ${campus.name}.`
        : `Preview of ${club.name} at ${campus.shortName}. Public club details are being prepared.`
      : 'This Pioneer Clubs page is unavailable.',
    canonicalPath: club && campus ? `/sites/${campus.slug}/${club.slug}` : '/',
    indexable: Boolean(PUBLIC_CONTENT_VERIFIED && club && campus),
  });

  const puckData = useMemo(() => {
    if (!resolvedCampus || !resolvedClub) return null;
    return getPuckLayout(resolvedCampus, resolvedClub);
  }, [resolvedCampus, resolvedClub, getPuckLayout]);

  // Quick cross-campus sibling links (e.g. PCSS I Robotics <-> PCSS II Robotics)
  const crossCampusPeers = useMemo(() => {
    if (!club) return [];
    return clubs
      .filter((c) => c.id !== club.id)
      .sort((a, b) => {
        const aSameCat = a.category === club.category ? 0 : 1;
        const bSameCat = b.category === club.category ? 0 : 1;
        return aSameCat - bSameCat;
      })
      .slice(0, 3);
  }, [clubs, club]);

  if (!club || !campus || !puckData) {
    return (
      <SiteShell>
        <main className="flex-1 max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-xs font-semibold text-[#8B1E24] dark:text-[#FCA5A5]">Page unavailable</p>
          <h1 className="font-display text-3xl font-bold text-[#0B2240] dark:text-white mt-2">
            We couldn't find this club
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-3">
            It may have moved or the link may be outdated. Browse the directory to find another club.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0B2240] dark:bg-[#8B1E24] text-white hover:bg-[#102A43] dark:hover:bg-[#A61C24] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse clubs</span>
          </Link>
        </main>
      </SiteShell>
    );
  }

  return (
    <SiteShell activeCampusSlug={campus.slug} activeClubSlug={club.slug}>

      {/* Dedicated Tenant Subdomain & Affiliation Header */}
      <div className="bg-white dark:bg-[#0E1C33] border-b border-[#E2E8F0] dark:border-[#1E3A5F] transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <Link
              to="/"
              className="text-[#64748B] dark:text-slate-400 hover:text-[#0B2240] dark:hover:text-white transition-colors font-medium"
            >
              pcssclubs.org
            </Link>
            <span className="text-[#CBD5E1] dark:text-[#1E3A5F]" aria-hidden="true">
              /
            </span>
            <Link
              to={buildCampusPath(campus.slug)}
              className={`font-semibold hover:underline ${
                CAMPUS_THEME_TOKENS[campus.themeColor]?.textClass ||
                'text-[#0B2240] dark:text-[#93C5FD]'
              }`}
            >
              {campus.name}
            </Link>
            <span className="text-[#CBD5E1] dark:text-[#1E3A5F]" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-[#1E293B] dark:text-slate-100">{club.name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {auth.capabilities.saveClubs && <SaveClubButton saved={isSaved(club.id)} onToggle={() => toggleSaved(club.id)} />}
            {(auth.status === 'error' || (auth.status === 'ready' && auth.configured && !auth.authenticated)) && <button type="button" onClick={() => void auth.signIn(window.location.pathname + window.location.search + window.location.hash)} className="inline-flex min-h-11 items-center rounded-lg border border-[#CBD5E1] px-3 text-xs font-semibold text-[#0B2240] hover:border-[#8B1E24] dark:border-[#1E3A5F] dark:text-slate-100">Sign in to save this club</button>}
            {storageError && <span role="alert" className="text-[#8B1E24] dark:text-[#FCA5A5]">Could not save on this browser.</span>}
            {club.advisorName && <span className="inline-flex items-center gap-1.5 text-[#475569] dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
              <span>Advisor: {club.advisorName}</span>
            </span>}
            {club.advisorEmail && <a
              href={`mailto:${club.advisorEmail}`}
              className="inline-flex items-center gap-1.5 text-[#1E3A5F] dark:text-[#93C5FD] hover:text-[#8B1E24] dark:hover:text-[#FCA5A5] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{club.advisorEmail}</span>
            </a>}
            {auth.canEdit && <Link
              to={buildEditorPath(campus.slug, club.slug)}
              className="inline-flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-[#0B2240] dark:bg-[#8B1E24] text-white hover:bg-[#8B1E24] dark:hover:bg-[#A61C24] transition-colors whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit page</span>
            </Link>}
          </div>
        </div>
      </div>

      {/* Puck-Rendered Custom Microsite Content */}
      <main className="flex-1">
        <PublicPageRenderer data={puckData} />

        {/* Cross-Campus Quick-Jump Strip */}
        {crossCampusPeers.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 pb-14">
            <div className="site-card bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
                <h2 className="font-display text-sm font-bold text-[#0B2240] dark:text-white">
                  Explore more clubs
                </h2>
                <Link
                  to="/"
                  className="text-xs font-semibold text-[#8B1E24] dark:text-[#FCA5A5] hover:underline"
                >
                  Browse All {clubs.length} Clubs →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {crossCampusPeers.map((peer) => {
                  const peerCampus = campuses.find((c) => c.slug === peer.campusSlug);
                  const peerTextClass =
                    (peerCampus && CAMPUS_THEME_TOKENS[peerCampus.themeColor]?.textClass) ||
                    'text-[#0B2240] dark:text-[#93C5FD]';
                  return (
                    <Link
                      key={peer.id}
                      to={buildClubPath(peer.campusSlug, peer.slug)}
                      className="site-card-interactive group p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#071120] border border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#0B2240] dark:hover:border-slate-400 transition-colors"
                    >
                      <p className={`text-[11px] font-semibold ${peerTextClass}`}>
                        {peerCampus?.shortName || peer.campusSlug} · {peer.category}
                      </p>
                      <p className="font-display text-sm font-bold text-[#1E293B] dark:text-slate-100 group-hover:text-[#8B1E24] dark:group-hover:text-[#FCA5A5] mt-1 truncate">
                        {peer.name}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

    </SiteShell>
  );
}
