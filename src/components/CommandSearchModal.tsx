import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import {
  CAMPUS_THEME_TOKENS,
  type CampusThemeColor,
  type ClubCategory,
} from '../data/registry';
import { useRegistry } from '../context/RegistryContext';
import { buildClubPath } from '../middleware/tenantRouting';
import { filterClubs } from '../data/registrySelectors';

interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function CommandSearchModal({ open, onClose }: CommandSearchModalProps) {
  const { clubs, campuses, availableCategories } = useRegistry();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<ClubCategory | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const campusMap = useMemo(() => {
    const map = new Map<string, { name: string; themeColor: CampusThemeColor }>();
    campuses.forEach((c) => map.set(c.slug, { name: c.name, themeColor: c.themeColor }));
    return map;
  }, [campuses]);

  const results = useMemo(() => {
    return filterClubs(clubs, campuses, {
      campusSlugs: selectedCampus === 'all' ? [] : [selectedCampus],
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      query,
    });
  }, [clubs, campuses, query, selectedCampus, selectedCategory]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedCampus('all');
      setSelectedCategory('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex((prev) =>
      results.length === 0 ? 0 : Math.min(prev, results.length - 1)
    );
  }, [results.length]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          results.length > 0 ? (prev - 1 + results.length) % results.length : 0
        );
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        const target = results[selectedIndex];
        navigate(buildClubPath(target.campusSlug, target.slug));
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, navigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0B2240]/60 p-3 backdrop-blur-xs dark:bg-black/75 sm:px-4 sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-label="Global club search"
      onClick={onClose}
    >
      <div
        className="site-card flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#1E3A5F] dark:bg-[#0E1C33] sm:max-h-[calc(100dvh-6rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
          <Search className="w-4 h-4 text-[#64748B] dark:text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search clubs"
            aria-label="Search clubs"
            className="min-w-0 w-full bg-transparent text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-medium text-[#64748B] dark:text-slate-400 hover:text-[#1E293B] dark:hover:text-white whitespace-nowrap"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#1E293B] dark:text-slate-400 dark:hover:bg-[#162947] dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campus & Category Quick Filters */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#071120] border-b border-[#E2E8F0] dark:border-[#1E3A5F] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCampus('all');
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCampus === 'all'
                  ? 'bg-[#0B2240] dark:bg-[#8B1E24] text-white'
                  : 'text-[#475569] dark:text-slate-300 hover:bg-white dark:hover:bg-[#162947]'
              }`}
            >
              All Campuses
            </button>
            {campuses.map((campus) => (
              <button
                key={campus.id}
                type="button"
                onClick={() => {
                  setSelectedCampus(campus.slug);
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCampus === campus.slug
                    ? CAMPUS_THEME_TOKENS[campus.themeColor]?.activeButtonClass ||
                      'bg-[#0B2240] text-white'
                    : 'text-[#475569] dark:text-slate-300 hover:bg-white dark:hover:bg-[#162947]'
                }`}
              >
                {campus.shortName}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as ClubCategory | 'all');
              setSelectedIndex(0);
            }}
            className="px-2.5 py-1 text-xs bg-white dark:bg-[#0E1C33] border border-[#CBD5E1] dark:border-[#1E3A5F] rounded-md text-[#1E293B] dark:text-slate-100 focus:outline-none focus:border-[#0B2240] dark:focus:border-[#D4AF37]"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Results List */}
        <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#1E3A5F] sm:max-h-[360px]">
          {results.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-[#1E293B] dark:text-slate-100">
                No clubs matched your current search criteria.
              </p>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                Try another club name or category.
              </p>
            </div>
          ) : (
            results.map((club, index) => {
              const isSelected = index === selectedIndex;
              const campusMeta = campusMap.get(club.campusSlug);
              const campusName = campusMeta?.name || club.campusSlug;
              const campusTextClass =
                (campusMeta && CAMPUS_THEME_TOKENS[campusMeta.themeColor]?.textClass) ||
                'text-[#0B2240] dark:text-[#93C5FD]';

              return (
                <button
                  type="button"
                  key={club.id}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    navigate(buildClubPath(club.campusSlug, club.slug));
                    onClose();
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#F8FAFC] dark:bg-[#162947]'
                      : 'bg-white dark:bg-[#0E1C33]'
                  }`}
                >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#64748B] dark:text-slate-400">
                      <span className={`font-semibold ${campusTextClass}`}>
                        {campusName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{club.category}</span>
                    </span>
                    <span className="block font-display text-sm font-semibold text-[#0B2240] dark:text-white mt-0.5 truncate">
                      {club.name}
                    </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs text-[#64748B] dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-slate-400">
          <span className="sm:hidden">Tap a club to open it</span>
          <span className="hidden sm:inline">Use ↑ ↓ arrows to navigate · Enter to visit microsite · Esc to close</span>
          <span className="shrink-0 font-mono tabular-nums">{results.length} clubs</span>
        </div>
      </div>
    </div>
  );
}
