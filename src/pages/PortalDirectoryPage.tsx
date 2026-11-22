import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  Search,
} from 'lucide-react';
import {
  CAMPUS_THEME_TOKENS,
  type Club,
  type ClubCategory,
  GENERATED_IMAGES,
  type MeetingDay,
} from '../data/registry';
import { useRegistry } from '../context/RegistryContext';
import { useAuth } from '../context/AuthContext';
import { useSavedClubs } from '../context/SavedClubsContext';
import {
  buildCampusPath,
  buildClubPath,
  buildEditorPath,
} from '../middleware/tenantRouting';
import { SiteShell } from '../components/SiteShell';
import { PioneerImage } from '../components/PioneerImage';
import { BlueRibbonRecognition } from '../components/BlueRibbonRecognition';
import { PUBLIC_CONTENT_VERIFIED } from '../data/publication';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { usePageScope } from '../puck/PageScope';
import { filterClubs } from '../data/registrySelectors';
import { ClubDirectoryCard } from '../components/directory/ClubDirectoryCard';
import { DirectoryFilters } from '../components/directory/DirectoryFilters';

const AddEntityDrawer = lazy(() => import('../components/AddEntityDrawer').then((module) => ({ default: module.AddEntityDrawer })));

interface PortalDirectoryPageProps {
  forcedCampusSlug?: string;
  eyebrow?: string;
  heading?: string;
  introduction?: string;
  embedded?: boolean;
}

export function PortalDirectoryPage({ forcedCampusSlug, eyebrow, heading, introduction, embedded = false }: PortalDirectoryPageProps) {
  const auth = useAuth();
  const { savedClubIds, storageError, isSaved, toggleSaved } = useSavedClubs();
  const { isEditing } = usePageScope();
  const showEditorControls = auth.canEdit && !isEditing;
  const canSaveClubs = auth.authenticated && !isEditing && auth.capabilities.saveClubs;
  const { campusSlug: paramCampusSlug } = useParams<{ campusSlug?: string }>();
  const activeRouteCampus = forcedCampusSlug || paramCampusSlug;

  const { campuses, clubs, campusMap, availableCategories } = useRegistry();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedCampuses, setSelectedCampuses] = useState<string[]>(
    activeRouteCampus ? [activeRouteCampus] : []
  );
  const [selectedCategory, setSelectedCategory] = useState<ClubCategory | 'All'>('All');
  const [selectedDay, setSelectedDay] = useState<MeetingDay | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [registryDrawerOpen, setRegistryDrawerOpen] = useState(false);
  const [registryDrawerMode, setRegistryDrawerMode] = useState<'club' | 'manage'>('club');
  const [recentlyAddedClub, setRecentlyAddedClub] = useState<Club | null>(null);

  useEffect(() => {
    const intent = new URLSearchParams(location.search).get('manage');
    if (auth.canEdit && (intent === 'manage' || intent === 'club')) {
      setRegistryDrawerMode(intent);
      setRegistryDrawerOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [auth.canEdit, location.pathname, location.search, navigate]);

  const openEditDrawer = (mode: 'manage' | 'club') => {
    if (auth.canEdit) { setRegistryDrawerMode(mode); setRegistryDrawerOpen(true); }
    else if (auth.status === 'error' || (auth.status === 'ready' && auth.configured)) void auth.signIn(`${location.pathname}?manage=${mode}`);
    else navigate('/editor/home');
  };

  useEffect(() => {
    setSelectedCampuses(activeRouteCampus ? [activeRouteCampus] : []);
  }, [activeRouteCampus]);

  const activeCampusObj = useMemo(
    () =>
      activeRouteCampus
        ? campuses.find((c) => c.slug.toLowerCase() === activeRouteCampus.toLowerCase())
        : undefined,
    [campuses, activeRouteCampus]
  );

  usePageMetadata({
    enabled: !isEditing,
    title: activeCampusObj
      ? `${activeCampusObj.name} Student Clubs | Pioneer Clubs`
      : 'Pioneer Clubs | Student Organizations Across Pioneer Campuses',
    description: PUBLIC_CONTENT_VERIFIED
      ? activeCampusObj
        ? `Explore student clubs and activities at ${activeCampusObj.name} in ${activeCampusObj.city}.`
        : 'Discover student clubs across Pioneer campuses. Explore club pages, meeting details, and campus communities.'
      : activeCampusObj
        ? `Preview of the ${activeCampusObj.name} club hub. Public club details are being prepared.`
        : 'Pioneer Clubs is a student organization portal for Pioneer Charter School of Science. Public club details are being prepared.',
    canonicalPath: activeCampusObj ? `/campus/${activeCampusObj.slug}` : '/',
    indexable: PUBLIC_CONTENT_VERIFIED,
  });

  const toggleCampusFilter = (slug: string) => {
    setSelectedCampuses((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const filteredClubs = useMemo(() => {
    return filterClubs(clubs, campuses, {
      campusSlugs: selectedCampuses,
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      day: selectedDay === 'All' ? undefined : selectedDay,
      query: searchQuery,
    });
  }, [clubs, campuses, selectedCampuses, selectedCategory, selectedDay, searchQuery]);

  const savedClubs = useMemo(() => savedClubIds.map((id) => clubs.find((club) => club.id === id)).filter((club): club is Club => Boolean(club)), [savedClubIds, clubs]);
  const activeFilterCount = selectedCampuses.length + (selectedCategory === 'All' ? 0 : 1) + (selectedDay === 'All' ? 0 : 1);

  const clearAllFilters = () => {
    setSelectedCampuses([]);
    setSelectedCategory('All');
    setSelectedDay('All');
    setSearchQuery('');
    if (activeRouteCampus) {
      navigate('/');
    }
  };

  const content = (
    <>
      {/* Institutional Split Hero */}
      <section className="site-hero bg-[#0B2240] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-wide text-[#D4AF37] mb-2">
              {eyebrow || (activeCampusObj
                ? `${activeCampusObj.name} · ${activeCampusObj.subdomain}`
                : 'Pioneer Charter School of Science · pcssclubs.org')}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance leading-[1.12]">
              {heading || (activeCampusObj
                ? `${activeCampusObj.name} Student Clubs & Societies`
                : 'Student Organizations Across Every Pioneer Campus')}
            </h1>
            <p className="mt-3 text-base text-slate-200 max-w-2xl leading-relaxed">
              {introduction || (activeCampusObj
                ? `Explore clubs and activities at ${activeCampusObj.name}. Find a group that interests you and see its meeting details.`
                : 'Explore student clubs across Pioneer campuses. Find what interests you and learn where to start.')}
            </p>
            {auth.status !== 'loading' && !auth.authenticated && <p className="mt-3 text-sm font-medium text-slate-200">No sign-in needed to browse. Use a school account when you want to save clubs.</p>}
            {(!activeCampusObj || activeCampusObj.slug === 'pcss2') && (
              <div className="mt-4 self-start" aria-label="PCSS II school recognition">
                <BlueRibbonRecognition />
              </div>
            )}

          </div>

          <div className="lg:col-span-5">
            <div className="site-card h-48 lg:h-full lg:min-h-[220px] rounded-2xl overflow-hidden border border-white/20 bg-[#102A43]">
              <PioneerImage
                src={GENERATED_IMAGES.campusHero}
                alt="Pioneer Charter School of Science campus courtyard"
                fallbackTitle="Pioneer Charter Campus"
                priority
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

      </section>

      {/* Main Directory & Multi-Filter Controls */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {canSaveClubs && storageError && <p role="alert" className="mb-4 text-sm font-semibold text-[#8B1E24] dark:text-[#FCA5A5]">This browser could not save your shortlist. Check browser storage settings and try again.</p>}
        <div id="club-directory" className="site-card bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-5 sm:p-7 mb-8 transition-colors scroll-mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B2240] dark:text-white">
                Club Directory
              </h2>
              <p className="text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
                Find a club by name, or narrow the list when you need to.
              </p>
              {canSaveClubs && savedClubs.length > 0 && <Link to="/my/clubs" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#8B1E24] hover:underline dark:text-[#FCA5A5]">{savedClubs.length} saved {savedClubs.length === 1 ? 'club' : 'clubs'} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1 sm:flex-initial">
                <Search
                  className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label="Search clubs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clubs"
                  className="pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#071120] text-[#1E293B] dark:text-slate-100 placeholder:text-[#64748B] dark:placeholder:text-slate-400 border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-lg w-full sm:w-64 focus:outline-none focus:border-[#0B2240] dark:focus:border-[#D4AF37]"
                />
              </div>

              {showEditorControls && <button
                type="button"
                onClick={() => openEditDrawer('manage')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#071120] text-[#0B2240] dark:text-slate-100 hover:border-[#0B2240] dark:hover:border-slate-400 transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
                <span>Manage clubs</span>
              </button>}
            </div>
          </div>

          <DirectoryFilters
            campuses={campuses}
            categories={availableCategories}
            selectedCampuses={selectedCampuses}
            selectedCategory={selectedCategory}
            selectedDay={selectedDay}
            activeCount={activeFilterCount}
            onToggleCampus={toggleCampusFilter}
            onCategoryChange={setSelectedCategory}
            onDayChange={setSelectedDay}
          />
        </div>

        {/* Newly Registered Club Confirmation Banner */}
        {recentlyAddedClub && (
          <div className="mb-6 bg-white dark:bg-[#0E1C33] border border-[#D4AF37] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#8B1E24] dark:text-[#FCA5A5]">
                Club Registered in Directory
              </p>
              <p className="font-display text-sm font-bold text-[#0B2240] dark:text-white mt-0.5 truncate">
                {recentlyAddedClub.name}{' '}
                <span className="font-mono text-xs font-normal text-[#64748B] dark:text-slate-400">
                  ({recentlyAddedClub.subdomain})
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
              <Link
                to={buildClubPath(recentlyAddedClub.campusSlug, recentlyAddedClub.slug)}
                className="text-xs font-semibold text-[#0B2240] dark:text-slate-200 hover:text-[#8B1E24] dark:hover:text-[#FCA5A5] transition-colors whitespace-nowrap"
              >
                Visit Microsite →
              </Link>
              <Link
                to={buildEditorPath(recentlyAddedClub.campusSlug, recentlyAddedClub.slug)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B2240] dark:bg-[#8B1E24] text-white hover:bg-[#102A43] dark:hover:bg-[#A61C24] transition-colors whitespace-nowrap"
              >
                Open Puck Editor
              </Link>
              <button
                type="button"
                onClick={() => setRecentlyAddedClub(null)}
                className="text-xs text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Results Count & Active Reset */}
        <div className="flex items-center justify-between mb-5 text-sm">
          <p className="text-[#475569] dark:text-slate-300">
            <span className="font-semibold text-[#0B2240] dark:text-white tabular-nums">{filteredClubs.length}</span> {filteredClubs.length === 1 ? 'club' : 'clubs'}
          </p>
          {(selectedCampuses.length > 0 ||
            selectedCategory !== 'All' ||
            selectedDay !== 'All' ||
            searchQuery) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#8B1E24] dark:text-[#FCA5A5] hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Club Directory Cards Grid */}
        {filteredClubs.length === 0 ? (
          <div className="site-card bg-white dark:bg-[#0E1C33] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-8 sm:p-12 text-center">
            <h3 className="font-display text-lg font-bold text-[#0B2240] dark:text-white">
              No clubs match these filters
            </h3>
            <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1 max-w-md mx-auto">
              Adjust your campus selection, meeting day, or discipline filter to view other
              Pioneer organizations.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B2240] dark:bg-[#8B1E24] text-white hover:bg-[#102A43] dark:hover:bg-[#A61C24] transition-colors"
            >
              Show All Clubs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <ClubDirectoryCard
                key={club.id}
                club={club}
                campus={campusMap.get(club.campusSlug.toLowerCase())}
                canSave={canSaveClubs}
                saved={isSaved(club.id)}
                onToggleSaved={() => toggleSaved(club.id)}
              />
            ))}
          </div>
        )}
      </main>

      <Suspense fallback={null}>
        {showEditorControls && registryDrawerOpen && <AddEntityDrawer
          open={registryDrawerOpen}
          onClose={() => setRegistryDrawerOpen(false)}
          defaultCampusSlug={activeRouteCampus}
          initialTab={registryDrawerMode}
          onCreatedClub={(_campusSlug, _clubSlug, club) => setRecentlyAddedClub(club)}
          onCreatedCampus={(campusSlug) => {
            navigate(buildCampusPath(campusSlug));
          }}
        />}
      </Suspense>
    </>
  );
  return embedded ? content : <SiteShell activeCampusSlug={activeRouteCampus}>{content}</SiteShell>;
}
