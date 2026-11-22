import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

type SavedClubsValue = {
  savedClubIds: string[];
  storageError: boolean;
  isSaved: (clubId: string) => boolean;
  toggleSaved: (clubId: string) => void;
};

const SavedClubsContext = createContext<SavedClubsValue>({
  savedClubIds: [],
  storageError: false,
  isSaved: () => false,
  toggleSaved: () => {},
});

function readSaved(key: string): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string').slice(0, 50) : [];
  } catch {
    return [];
  }
}

export function SavedClubsProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const key = auth.capabilities.saveClubs && auth.user?.email
    ? `pcss-saved-clubs:v1:${auth.user.email.trim().toLowerCase()}`
    : null;
  const [loaded, setLoaded] = useState<{ key: string; ids: string[] } | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    setLoaded(key ? { key, ids: readSaved(key) } : null);
    setStorageError(false);
    if (!key) return;
    const syncFromBrowser = (event: StorageEvent) => {
      if (event.key === key) setLoaded({ key, ids: readSaved(key) });
    };
    window.addEventListener('storage', syncFromBrowser);
    return () => window.removeEventListener('storage', syncFromBrowser);
  }, [key]);

  const savedClubIds = useMemo(() => loaded?.key === key ? loaded.ids : [], [loaded, key]);
  const isSaved = useCallback((clubId: string) => savedClubIds.includes(clubId), [savedClubIds]);
  const toggleSaved = useCallback((clubId: string) => {
    if (!key) return;
    const current = loaded?.key === key ? loaded.ids : readSaved(key);
    const next = current.includes(clubId)
      ? current.filter((id) => id !== clubId)
      : [...current, clubId].slice(0, 50);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      setLoaded({ key, ids: next });
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [key, loaded]);

  return <SavedClubsContext.Provider value={{ savedClubIds, storageError, isSaved, toggleSaved }}>{children}</SavedClubsContext.Provider>;
}

export function useSavedClubs() {
  return useContext(SavedClubsContext);
}
