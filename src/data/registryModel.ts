import { PORTAL_BASE_DOMAIN } from '../middleware/tenantRouting';
import { CAMPUS_THEME_TOKENS, GENERATED_IMAGES, MEETING_DAYS, type Campus, type Club, type ClubCategory } from './registry';

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function campusHostname(slug: string): string {
  return `${slug}.${PORTAL_BASE_DOMAIN}`;
}

export function clubHostname(campusSlug: string, slug: string): string {
  return `${slug}.${campusSlug}.${PORTAL_BASE_DOMAIN}`;
}

const CATEGORY_COVERS: Record<string, string> = {
  'STEM & Robotics': GENERATED_IMAGES.roboticsLab,
  'Science & Research': GENERATED_IMAGES.scienceLab,
  Mathematics: GENERATED_IMAGES.mathSeminar,
};

export function defaultClubCover(category: ClubCategory): string {
  return CATEGORY_COVERS[category] || GENERATED_IMAGES.campusHero;
}

export function campusSlugAvailable(campuses: Campus[], slug: string, excludeId?: string): boolean {
  return !campuses.some((campus) => campus.id !== excludeId && campus.slug.toLowerCase() === slug.toLowerCase());
}

export function clubSlugAvailable(clubs: Club[], campusSlug: string, slug: string, excludeId?: string): boolean {
  return !clubs.some((club) => club.id !== excludeId && club.campusSlug.toLowerCase() === campusSlug.toLowerCase() && club.slug.toLowerCase() === slug.toLowerCase());
}

export function createCampusRecord(input: Omit<Campus, 'id' | 'subdomain'>, campuses: Campus[]): Campus {
  const slug = normalizeSlug(input.slug || input.shortName || input.name);
  if (!input.name.trim() || !slug) throw new Error('School name and a valid slug are required.');
  if (!campusSlugAvailable(campuses, slug)) throw new Error(`School slug "${slug}" is already in use.`);
  const created = { ...input, name: input.name.trim(), slug, id: `campus-${slug}-${crypto.randomUUID()}`, subdomain: campusHostname(slug) };
  const error = validateRegistry([...campuses, created], []);
  if (error) throw new Error(error);
  return created;
}

export function updateCampusRecord(campus: Campus, patch: Partial<Omit<Campus, 'id' | 'subdomain'>>, campuses: Campus[]): Campus {
  const slug = normalizeSlug(patch.slug ?? campus.slug);
  const name = (patch.name ?? campus.name).trim();
  if (!name || !slug) throw new Error('School name and a valid slug are required.');
  if (!campusSlugAvailable(campuses, slug, campus.id)) throw new Error(`School slug "${slug}" is already in use.`);
  const updated = { ...campus, ...patch, name, slug, subdomain: campusHostname(slug) };
  const error = validateRegistry(campuses.map((item) => item.id === campus.id ? updated : item), []);
  if (error) throw new Error(error);
  return updated;
}

export function createClubRecord(input: Omit<Club, 'id' | 'subdomain'>, campuses: Campus[], clubs: Club[]): Club {
  const slug = normalizeSlug(input.slug || input.name);
  const campus = campuses.find((item) => item.slug.toLowerCase() === input.campusSlug.toLowerCase());
  if (!campus) throw new Error('Select an existing school.');
  if (!input.name.trim() || !slug) throw new Error('Club name and a valid slug are required.');
  if (!clubSlugAvailable(clubs, campus.slug, slug)) throw new Error(`Club slug "${slug}" is already in use at ${campus.name}.`);
  const created = { ...input, name: input.name.trim(), slug, campusSlug: campus.slug, id: `club-${campus.slug}-${slug}-${crypto.randomUUID()}`, subdomain: clubHostname(campus.slug, slug), coverImage: input.coverImage || defaultClubCover(input.category) };
  const error = validateRegistry(campuses, [...clubs, created]);
  if (error) throw new Error(error);
  return created;
}

export function updateClubRecord(club: Club, patch: Partial<Omit<Club, 'id' | 'subdomain'>>, campuses: Campus[], clubs: Club[]): Club {
  const slug = normalizeSlug(patch.slug ?? club.slug);
  const name = (patch.name ?? club.name).trim();
  const requestedCampus = patch.campusSlug ?? club.campusSlug;
  const campus = campuses.find((item) => item.slug.toLowerCase() === requestedCampus.toLowerCase());
  if (!campus) throw new Error('Select an existing school.');
  if (!name || !slug) throw new Error('Club name and a valid slug are required.');
  if (!clubSlugAvailable(clubs, campus.slug, slug, club.id)) throw new Error(`Club slug "${slug}" is already in use at ${campus.name}.`);
  const updated = { ...club, ...patch, name, slug, campusSlug: campus.slug, subdomain: clubHostname(campus.slug, slug) };
  const error = validateRegistry(campuses, clubs.map((item) => item.id === club.id ? updated : item));
  if (error) throw new Error(error);
  return updated;
}

export function validateRegistry(campuses: Campus[], clubs: Club[]): string | null {
  if (!campuses.length) return 'At least one school is required.';
  const schoolSlugs = new Set<string>();
  const ids = new Set<string>();
  for (const campus of campuses) {
    if (!campus || typeof campus.name !== 'string' || !campus.name.trim() || typeof campus.slug !== 'string' || !campus.slug || normalizeSlug(campus.slug) !== campus.slug || schoolSlugs.has(campus.slug) || typeof campus.id !== 'string' || !campus.id || ids.has(campus.id)) return 'Schools need unique valid slugs, IDs, and names.';
    if (typeof campus.shortName !== 'string' || !campus.shortName.trim() || typeof campus.city !== 'string' || typeof campus.address !== 'string' || typeof campus.gradesServed !== 'string' || !(campus.themeColor in CAMPUS_THEME_TOKENS) || !Number.isInteger(campus.foundedYear) || campus.foundedYear < 1) return 'A school needs a short name and valid founding year.';
    schoolSlugs.add(campus.slug);
    ids.add(campus.id);
  }
  const clubKeys = new Set<string>();
  for (const club of clubs) {
    if (!club || typeof club.campusSlug !== 'string' || !schoolSlugs.has(club.campusSlug) || typeof club.name !== 'string' || !club.name.trim() || typeof club.slug !== 'string' || !club.slug || normalizeSlug(club.slug) !== club.slug || typeof club.id !== 'string' || !club.id || ids.has(club.id)) return 'Clubs need an existing school and unique valid slugs and IDs.';
    const key = `${club.campusSlug}:${club.slug}`;
    if (clubKeys.has(key)) return 'Clubs need an existing school and unique valid slugs and IDs.';
    if (typeof club.category !== 'string' || !club.category.trim() || typeof club.shortDescription !== 'string' || typeof club.advisorName !== 'string' || typeof club.advisorEmail !== 'string' || typeof club.studentLead !== 'string' || !Array.isArray(club.meetingDays) || !club.meetingDays.every((day) => MEETING_DAYS.includes(day)) || typeof club.meetingTime !== 'string' || typeof club.roomNumber !== 'string' || !Number.isInteger(club.memberCount) || club.memberCount < 0 || typeof club.coverImage !== 'string' || typeof club.openEnrollment !== 'boolean') return 'A club has missing or invalid details.';
    clubKeys.add(key);
    ids.add(club.id);
  }
  return null;
}
