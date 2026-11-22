import type { Campus, Club } from './registry';
import { campusHostname, clubHostname, validateRegistry } from './registryModel';

export interface RegistrySnapshot {
  version: 1;
  exportedAt: string;
  campuses: Campus[];
  clubs: Club[];
}

export type SnapshotImport =
  | { ok: true; campuses: Campus[]; clubs: Club[] }
  | { ok: false; error: string };

export function createRegistrySnapshot(campuses: Campus[], clubs: Club[]): RegistrySnapshot {
  return { version: 1, exportedAt: new Date().toISOString(), campuses, clubs };
}

export function parseRegistrySnapshot(rawJson: string): SnapshotImport {
  let value: unknown;
  try { value = JSON.parse(rawJson); }
  catch { return { ok: false, error: 'Invalid JSON syntax.' }; }

  if (!value || typeof value !== 'object') return { ok: false, error: 'Registry JSON must be an object.' };
  const parsed = value as Partial<RegistrySnapshot>;
  if (parsed.version !== undefined && parsed.version !== 1) {
    return { ok: false, error: 'Unsupported registry snapshot version.' };
  }
  if (!Array.isArray(parsed.campuses) || !Array.isArray(parsed.clubs)) {
    return { ok: false, error: 'JSON must include "campuses" and "clubs" arrays.' };
  }
  const error = validateRegistry(parsed.campuses, parsed.clubs);
  if (error) return { ok: false, error };

  return {
    ok: true,
    campuses: parsed.campuses.map((campus) => ({ ...campus, subdomain: campusHostname(campus.slug) })),
    clubs: parsed.clubs.map((club) => ({ ...club, subdomain: clubHostname(club.campusSlug, club.slug) })),
  };
}
