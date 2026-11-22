import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Edit3,
  Globe,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { useRegistry } from '../context/RegistryContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AuthNavControl } from './AuthNavControl';
import { AuthFeedback } from './AuthFeedback';
import { BrandLockup } from './BrandLockup';
import {
  buildCampusPath,
  buildClubPath,
  buildEditorPath,
} from '../middleware/tenantRouting';
import { editorPath } from '../puck/pageModel';
import { AUTH_COPY } from '../data/authCopy';

const CommandSearchModal = lazy(() => import('./CommandSearchModal').then((module) => ({ default: module.CommandSearchModal })));
interface NavbarProps {
  activeCampusSlug?: string;
  activeClubSlug?: string;
}

export function Navbar({ activeCampusSlug, activeClubSlug }: NavbarProps) {
  const { campuses, clubs, getClubBySlugs } = useRegistry();
  const { isDark, toggleTheme } = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [campusMenuOpen, setCampusMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileCampus, setOpenMobileCampus] = useState<string | null>(
    activeCampusSlug || null
  );

  const navRef = useRef<HTMLDivElement>(null);

  const currentClub =
    activeCampusSlug && activeClubSlug
      ? getClubBySlugs(activeCampusSlug, activeClubSlug)
      : undefined;
  const currentEditorPath = currentClub
    ? buildEditorPath(currentClub.campusSlug, currentClub.slug)
    : location.pathname === '/credits'
      ? editorPath({ kind: 'credits' })
      : activeCampusSlug
        ? editorPath({ kind: 'campus', campusSlug: activeCampusSlug })
        : location.pathname === '/'
          ? editorPath({ kind: 'home' })
          : null;

  // Global Cmd+K / Ctrl+K / "/" keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus on route change or outside click
  useEffect(() => {
    setCampusMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setCampusMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCampusLabel = useMemo(() => {
    if (!activeCampusSlug) return 'Campuses';
    const found = campuses.find((c) => c.slug === activeCampusSlug);
    return found ? found.shortName : 'Campuses';
  }, [campuses, activeCampusSlug]);

  return (
    <>
    <div ref={navRef} className="sticky top-0 z-40">
      <header className="site-nav bg-[#0B2240] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 xl:gap-8">
          {/* Student clubs identity */}
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            <BrandLockup />
          </Link>

          {/* Zone 2: Desktop Single-Line Navigation */}
          <nav
            aria-label="Global campus navigation"
            className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-200"
          >
            <Link
              to="/"
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                location.pathname === '/' ? 'text-white underline underline-offset-8 decoration-[#D4AF37] decoration-2' : ''
              }`}
            >
              Directory
            </Link>

            <Link to="/support" className={`whitespace-nowrap transition-colors hover:text-white ${location.pathname === '/support' ? 'text-white underline decoration-[#D4AF37] decoration-2 underline-offset-8' : ''}`}>Support</Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCampusMenuOpen((prev) => !prev);
                }}
                aria-expanded={campusMenuOpen}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>{activeCampusLabel}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    campusMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {campusMenuOpen && (
                <div className="absolute left-0 top-full mt-3 w-72 bg-white dark:bg-[#0E1C33] text-[#1E293B] dark:text-slate-100 border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#071120] border-b border-[#E2E8F0] dark:border-[#1E3A5F] text-xs font-semibold text-[#64748B] dark:text-slate-400">
                    Switch Campus Portal
                  </div>
                  <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className={`w-full px-4 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#162947] transition-colors flex items-center justify-between ${
                        !activeCampusSlug ? 'bg-[#F8FAFC] dark:bg-[#162947] font-semibold' : ''
                      }`}
                    >
                      <span className="text-sm font-semibold text-[#0B2240] dark:text-white">All campuses</span>
                    </button>

                    {campuses.map((campus) => {
                      const isActive = activeCampusSlug === campus.slug;
                      return (
                        <button
                          key={campus.id}
                          type="button"
                          onClick={() => navigate(buildCampusPath(campus.slug))}
                          className={`w-full px-4 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#162947] transition-colors flex items-center justify-between ${
                            isActive ? 'bg-[#F8FAFC] dark:bg-[#162947]' : ''
                          }`}
                        >
                          <span className="text-sm font-semibold text-[#0B2240] dark:text-white">{campus.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Search</span>
            </button>
          </nav>

          {/* Zone 3: Theme Toggle + Single Primary Action + Mobile Trigger */}
          <div className="flex items-center gap-0.5 sm:gap-2.5 shrink-0">
            {auth.authenticated && <Link to="/my" className="hidden xl:inline-flex rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10">{AUTH_COPY.mySpace}</Link>}
            <AuthNavControl />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {auth.canEdit && currentEditorPath && (currentClub ? (
              <Link
                to={buildEditorPath(currentClub.campusSlug, currentClub.slug)}
                className="site-action hidden xl:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#8B1E24] text-white hover:bg-[#A61C24] transition-colors whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit Club Page</span>
              </Link>
            ) : (
              <Link
                to={currentEditorPath}
                className="site-action hidden xl:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#8B1E24] text-white hover:bg-[#A61C24] transition-colors whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit This Page</span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open global search"
              className="xl:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="xl:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer with Campus Accordions */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white dark:bg-[#0E1C33] text-[#1E293B] dark:text-slate-100 border-b border-[#E2E8F0] dark:border-[#1E3A5F] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 space-y-3">
              <AuthNavControl mobile />
              <Link to="/support" className="flex min-h-11 items-center rounded-lg border border-[#E2E8F0] px-4 text-sm font-semibold text-[#0B2240] dark:border-[#1E3A5F] dark:text-white">Support Center</Link>
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
                <Link
                  to="/"
                  className="text-sm font-semibold text-[#0B2240] dark:text-white flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" />
                  <span>All Campuses (pcssclubs.org)</span>
                </Link>
                {auth.canEdit && currentEditorPath && (currentClub ? (
                  <Link
                    to={buildEditorPath(currentClub.campusSlug, currentClub.slug)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#8B1E24] text-white"
                  >
                    Edit Page
                  </Link>
                ) : (
                  <Link to={currentEditorPath} className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#8B1E24] text-white">
                    Edit This Page
                  </Link>
                ))}
              </div>

              {campuses.map((campus) => {
                const isOpen = openMobileCampus === campus.slug;
                const campusClubs = clubs.filter((c) => c.campusSlug === campus.slug);
                return (
                  <div
                    key={campus.id}
                    className="border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMobileCampus(isOpen ? null : campus.slug)
                      }
                      aria-expanded={isOpen}
                      className="w-full px-4 py-3 flex items-center justify-between text-left"
                    >
                      <span className="font-display text-sm font-bold text-[#0B2240] dark:text-white">{campus.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#64748B] dark:text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#071120] divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F]">
                        <Link
                          to={buildCampusPath(campus.slug)}
                          className="block px-4 py-2.5 text-xs font-semibold text-[#8B1E24] dark:text-[#FCA5A5]"
                        >
                          View {campus.shortName} Campus Hub →
                        </Link>
                        {campusClubs.map((club) => (
                          <Link
                            key={club.id}
                            to={buildClubPath(club.campusSlug, club.slug)}
                            className="block px-4 py-2.5 text-sm text-[#1E293B] dark:text-slate-100"
                          >
                            <span className="font-medium block">{club.name}</span>
                            <span className="text-xs text-[#64748B] dark:text-slate-400">
                              {club.category}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <Suspense fallback={null}>
        {searchOpen && <CommandSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
      </Suspense>
    </div>
    <AuthFeedback />
    </>
  );
}
