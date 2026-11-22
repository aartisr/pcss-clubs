import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Data } from '@measured/puck';
import {
  CLUB_CATEGORIES,
  type Campus,
  type Club,
  INITIAL_CAMPUSES,
  INITIAL_CLUBS,
  createDefaultPuckData,
} from '../data/registry';
import { createDefaultPageData, type PageReference } from '../puck/pageModel';
import { loadPageLayout, savePageLayout as persistPageLayout, resetPageLayout as clearPageLayout, transferPageLayout, removePageLayout } from '../puck/pageLayoutStore';
import { clubHostname, createCampusRecord, createClubRecord, updateCampusRecord, updateClubRecord, validateRegistry } from '../data/registryModel';
import { createRegistrySnapshot, parseRegistrySnapshot, type RegistrySnapshot } from '../data/registrySnapshot';

const CAMPUSES_STORAGE_KEY = 'pcss_registry_campuses_v1';
const CLUBS_STORAGE_KEY = 'pcss_registry_clubs_v1';

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

interface RegistryContextValue {
  campuses: Campus[];
  clubs: Club[];
  campusMap: Map<string, Campus>;
  availableCategories: string[];
  addCampus: (campus: Omit<Campus, 'id' | 'subdomain'>) => Campus;
  updateCampus: (campusId: string, patch: Partial<Omit<Campus, 'id'>>) => void;
  deleteCampus: (campusId: string) => void;
  addClub: (club: Omit<Club, 'id' | 'subdomain'>) => Club;
  updateClub: (clubId: string, patch: Partial<Omit<Club, 'id'>>) => void;
  deleteClub: (clubId: string) => void;
  associateClubWithCampus: (
    clubId: string,
    targetCampusSlug: string,
    mode: 'clone' | 'move'
  ) => Club | null;
  getCampusBySlug: (slug: string) => Campus | undefined;
  getClubBySlugs: (campusSlug: string, clubSlug: string) => Club | undefined;
  getClubsByCampus: (campusSlug: string) => Club[];
  getPuckLayout: (campusSlug: string, clubSlug: string) => Data;
  savePuckLayout: (campusSlug: string, clubSlug: string, data: Data) => void;
  resetPuckLayout: (campusSlug: string, clubSlug: string) => Data;
  getPageLayout: (page: PageReference) => Data;
  savePageLayout: (page: PageReference, data: Data) => boolean;
  resetPageLayout: (page: PageReference) => Data;
  exportRegistrySnapshot: () => RegistrySnapshot;
  importRegistrySnapshot: (rawJson: string) => { ok: boolean; error?: string; count?: number };
  resetAllRegistry: () => void;
}

const RegistryContext = createContext<RegistryContextValue | null>(null);

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}


export function RegistryProvider({ children }: { children: React.ReactNode }) {
  const [campuses, setCampuses] = useState<Campus[]>(() =>
    {
      const saved = safeReadJson<Campus[]>(CAMPUSES_STORAGE_KEY, INITIAL_CAMPUSES);
      return Array.isArray(saved) && !validateRegistry(saved, []) ? saved : INITIAL_CAMPUSES;
    }
  );
  const [clubs, setClubs] = useState<Club[]>(() =>
    {
      const fallback = INITIAL_CLUBS.filter((club) => campuses.some((campus) => campus.slug === club.campusSlug));
      const saved = safeReadJson<Club[]>(CLUBS_STORAGE_KEY, fallback);
      return Array.isArray(saved) && !validateRegistry(campuses, saved) ? saved : fallback;
    }
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(CAMPUSES_STORAGE_KEY, JSON.stringify(campuses));
    } catch {
      // Ignore storage quota errors
    }
  }, [campuses]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CLUBS_STORAGE_KEY, JSON.stringify(clubs));
    } catch {
      // Ignore storage quota errors
    }
  }, [clubs]);

  const campusMap = useMemo(() => {
    const map = new Map<string, Campus>();
    campuses.forEach((c) => map.set(c.slug.toLowerCase(), c));
    return map;
  }, [campuses]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>(CLUB_CATEGORIES);
    clubs.forEach((club) => {
      if (club.category?.trim()) {
        set.add(club.category.trim());
      }
    });
    return Array.from(set);
  }, [clubs]);

  const getCampusBySlug = useCallback(
    (slug: string) => campusMap.get(slug.toLowerCase()),
    [campusMap]
  );

  const getClubBySlugs = useCallback(
    (campusSlug: string, clubSlug: string) =>
      clubs.find(
        (c) =>
          c.campusSlug.toLowerCase() === campusSlug.toLowerCase() &&
          c.slug.toLowerCase() === clubSlug.toLowerCase()
      ),
    [clubs]
  );

  const getClubsByCampus = useCallback(
    (campusSlug: string) =>
      clubs.filter((c) => c.campusSlug.toLowerCase() === campusSlug.toLowerCase()),
    [clubs]
  );

  const addCampus = useCallback((input: Omit<Campus, 'id' | 'subdomain'>) => {
    const created = createCampusRecord(input, campuses);
    setCampuses((prev) => [...prev, created]);
    return created;
  }, [campuses]);

  const updateCampus = useCallback(
    (campusId: string, patch: Partial<Omit<Campus, 'id'>>) => {
      const current = campuses.find((campus) => campus.id === campusId);
      if (!current) throw new Error('School not found.');
      const next = updateCampusRecord(current, patch, campuses);
      setCampuses((prev) => prev.map((campus) => campus.id === campusId ? next : campus));
      if (current.slug !== next.slug) {
        setClubs((prev) => prev.map((club) => club.campusSlug === current.slug
          ? { ...club, campusSlug: next.slug, subdomain: clubHostname(next.slug, club.slug) }
          : club));
        transferPageLayout({ kind: 'campus', campusSlug: current.slug }, { kind: 'campus', campusSlug: next.slug }, browserStorage(), true);
        for (const club of clubs.filter((item) => item.campusSlug === current.slug)) {
          transferPageLayout({ kind: 'club', campusSlug: current.slug, clubSlug: club.slug }, { kind: 'club', campusSlug: next.slug, clubSlug: club.slug }, browserStorage(), true);
        }
      }
    },
    [campuses, clubs]
  );

  const deleteCampus = useCallback((campusId: string) => {
    const target = campuses.find((campus) => campus.id === campusId);
    if (!target) return;
    if (campuses.length === 1) throw new Error('Keep at least one school in the directory.');
    for (const club of clubs.filter((item) => item.campusSlug === target.slug)) {
      removePageLayout({ kind: 'club', campusSlug: target.slug, clubSlug: club.slug }, browserStorage());
    }
    removePageLayout({ kind: 'campus', campusSlug: target.slug }, browserStorage());
    setClubs((prev) => prev.filter((club) => club.campusSlug !== target.slug));
    setCampuses((prev) => prev.filter((campus) => campus.id !== campusId));
  }, [campuses, clubs]);

  const addClub = useCallback((input: Omit<Club, 'id' | 'subdomain'>) => {
    const created = createClubRecord(input, campuses, clubs);
    setClubs((prev) => [...prev, created]);
    return created;
  }, [campuses, clubs]);

  const updateClub = useCallback((clubId: string, patch: Partial<Omit<Club, 'id'>>) => {
    const current = clubs.find((club) => club.id === clubId);
    if (!current) throw new Error('Club not found.');
    const next = updateClubRecord(current, patch, campuses, clubs);
    setClubs((prev) => prev.map((club) => club.id === clubId ? next : club));
    transferPageLayout({ kind: 'club', campusSlug: current.campusSlug, clubSlug: current.slug }, { kind: 'club', campusSlug: next.campusSlug, clubSlug: next.slug }, browserStorage(), true);
  }, [campuses, clubs]);

  const deleteClub = useCallback((clubId: string) => {
    const target = clubs.find((club) => club.id === clubId);
    if (target) removePageLayout({ kind: 'club', campusSlug: target.campusSlug, clubSlug: target.slug }, browserStorage());
    setClubs((prev) => prev.filter((c) => c.id !== clubId));
  }, [clubs]);

  const getPuckLayout = useCallback(
    (campusSlug: string, clubSlug: string): Data => {
      const campus =
        campusMap.get(campusSlug.toLowerCase()) || campuses[0] || INITIAL_CAMPUSES[0];
      const club = clubs.find(
        (c) =>
          c.campusSlug.toLowerCase() === campusSlug.toLowerCase() &&
          c.slug.toLowerCase() === clubSlug.toLowerCase()
      );
      const fallback = club ? createDefaultPuckData(club, campus) : {
        root: { props: { title: 'Pioneer Club Microsite' } },
        content: [],
      };
      return loadPageLayout({ kind: 'club', campusSlug, clubSlug }, browserStorage(), fallback);
    },
    [campusMap, campuses, clubs]
  );

  const savePuckLayout = useCallback((campusSlug: string, clubSlug: string, data: Data) => {
    persistPageLayout({ kind: 'club', campusSlug, clubSlug }, browserStorage(), data);
  }, []);

  const resetPuckLayout = useCallback(
    (campusSlug: string, clubSlug: string): Data => {
      const campus =
        campusMap.get(campusSlug.toLowerCase()) || campuses[0] || INITIAL_CAMPUSES[0];
      const club = clubs.find(
        (c) =>
          c.campusSlug.toLowerCase() === campusSlug.toLowerCase() &&
          c.slug.toLowerCase() === clubSlug.toLowerCase()
      );
      const fallback = club
        ? createDefaultPuckData(club, campus)
        : { root: { props: { title: 'Pioneer Club Microsite' } }, content: [] };
      return clearPageLayout({ kind: 'club', campusSlug, clubSlug }, browserStorage(), fallback);
    },
    [campusMap, campuses, clubs]
  );

  const getPageLayout = useCallback((page: PageReference): Data => {
    if (page.kind === 'club') return getPuckLayout(page.campusSlug, page.clubSlug);
    return loadPageLayout(page, browserStorage(), createDefaultPageData(page, campuses, clubs));
  }, [getPuckLayout, campuses, clubs]);

  const savePageLayout = useCallback((page: PageReference, data: Data): boolean => {
    return persistPageLayout(page, browserStorage(), data);
  }, []);

  const resetPageLayout = useCallback((page: PageReference): Data => {
    if (page.kind === 'club') return resetPuckLayout(page.campusSlug, page.clubSlug);
    return clearPageLayout(page, browserStorage(), createDefaultPageData(page, campuses, clubs));
  }, [resetPuckLayout, campuses, clubs]);

  const associateClubWithCampus = useCallback(
    (clubId: string, targetCampusSlug: string, mode: 'clone' | 'move'): Club | null => {
      const source = clubs.find((c) => c.id === clubId);
      const targetCampus = campusMap.get(targetCampusSlug.toLowerCase());
      if (!source || !targetCampus) return null;

      if (mode === 'move') {
        let moved: Club;
        try { moved = updateClubRecord(source, { campusSlug: targetCampus.slug }, campuses, clubs); }
        catch { return null; }
        setClubs((prev) => prev.map((c) => (c.id === clubId ? moved : c)));
        transferPageLayout({ kind: 'club', campusSlug: source.campusSlug, clubSlug: source.slug }, { kind: 'club', campusSlug: targetCampus.slug, clubSlug: moved.slug }, browserStorage(), true);
        return moved;
      }

      let cloned: Club;
      try { cloned = createClubRecord({ ...source, campusSlug: targetCampus.slug }, campuses, clubs); }
      catch { return null; }
      setClubs((prev) => [...prev, cloned]);
      transferPageLayout({ kind: 'club', campusSlug: source.campusSlug, clubSlug: source.slug }, { kind: 'club', campusSlug: cloned.campusSlug, clubSlug: cloned.slug }, browserStorage(), false);
      return cloned;
    },
    [clubs, campuses, campusMap]
  );

  const exportRegistrySnapshot = useCallback(
    (): RegistrySnapshot => createRegistrySnapshot(campuses, clubs),
    [campuses, clubs]
  );

  const importRegistrySnapshot = useCallback(
    (rawJson: string): { ok: boolean; error?: string; count?: number } => {
      const parsed = parseRegistrySnapshot(rawJson);
      if (!parsed.ok) return parsed;
      setCampuses(parsed.campuses);
      setClubs(parsed.clubs);
      return { ok: true, count: parsed.clubs.length };
    },
    []
  );

  const resetAllRegistry = useCallback(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('pcss_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore
    }
    setCampuses(INITIAL_CAMPUSES);
    setClubs(INITIAL_CLUBS);
  }, []);

  const contextValue = useMemo<RegistryContextValue>(
    () => ({
      campuses,
      clubs,
      campusMap,
      availableCategories,
      addCampus,
      updateCampus,
      deleteCampus,
      addClub,
      updateClub,
      deleteClub,
      associateClubWithCampus,
      getCampusBySlug,
      getClubBySlugs,
      getClubsByCampus,
      getPuckLayout,
      savePuckLayout,
      resetPuckLayout,
      getPageLayout,
      savePageLayout,
      resetPageLayout,
      exportRegistrySnapshot,
      importRegistrySnapshot,
      resetAllRegistry,
    }),
    [
      campuses,
      clubs,
      campusMap,
      availableCategories,
      addCampus,
      updateCampus,
      deleteCampus,
      addClub,
      updateClub,
      deleteClub,
      associateClubWithCampus,
      getCampusBySlug,
      getClubBySlugs,
      getClubsByCampus,
      getPuckLayout,
      savePuckLayout,
      resetPuckLayout,
      getPageLayout,
      savePageLayout,
      resetPageLayout,
      exportRegistrySnapshot,
      importRegistrySnapshot,
      resetAllRegistry,
    ]
  );

  return (
    <RegistryContext.Provider value={contextValue}>
      {children}
    </RegistryContext.Provider>
  );
}

export function useRegistry() {
  const ctx = useContext(RegistryContext);
  if (!ctx) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return ctx;
}
