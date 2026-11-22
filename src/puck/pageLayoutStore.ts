import type { Data } from '@measured/puck';
import { isValidPageData, normalizePageData, pageKey, type PageReference } from './pageModel';

// Club keys retain their previous format so existing browser edits still load.
export function layoutStorageKey(page: PageReference): string {
  return page.kind === 'club'
    ? `pcss_puck_layout_v1_${page.campusSlug.toLowerCase()}_${page.clubSlug.toLowerCase()}`
    : `pcss_page_layout_v1_${pageKey(page)}`;
}

export function loadPageLayout(page: PageReference, storage: Pick<Storage, 'getItem'> | null, fallback: Data): Data {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(layoutStorageKey(page));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Data;
    const normalized = normalizePageData(page, parsed);
    return isValidPageData(page, normalized) ? normalized : fallback;
  } catch {
    return fallback;
  }
}

export function savePageLayout(page: PageReference, storage: Pick<Storage, 'setItem'> | null, data: Data): boolean {
  const normalized = normalizePageData(page, data);
  if (!storage || !isValidPageData(page, normalized)) return false;
  try {
    storage.setItem(layoutStorageKey(page), JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function resetPageLayout(page: PageReference, storage: Pick<Storage, 'removeItem'> | null, fallback: Data): Data {
  try {
    storage?.removeItem(layoutStorageKey(page));
  } catch {
    // Return the default in this session even if storage is unavailable.
  }
  return fallback;
}

export function transferPageLayout(from: PageReference, to: PageReference, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null, move: boolean): void {
  if (!storage) return;
  try {
    const sourceKey = layoutStorageKey(from);
    const targetKey = layoutStorageKey(to);
    if (sourceKey === targetKey) return;
    const raw = storage.getItem(sourceKey);
    if (raw) {
      storage.setItem(targetKey, raw);
      if (move) storage.removeItem(sourceKey);
    }
  } catch {
    // The registry change still succeeds; browser storage may be unavailable.
  }
}

export function removePageLayout(page: PageReference, storage: Pick<Storage, 'removeItem'> | null): void {
  try { storage?.removeItem(layoutStorageKey(page)); } catch { /* Ignore unavailable storage. */ }
}
