import type { Data } from '@measured/puck';
import { INITIAL_CAMPUSES, INITIAL_CLUBS, type Campus, type Club } from '../data/registry';
import { areasFromLegacyContributors, CREDIT_PAGE_COPY, defaultCreditAreas, type EditableCreditArea, type EditableCreditPerson, type LegacyContributor } from '../data/credits';
import { buildCampusPath, buildClubPath, buildEditorPath } from '../middleware/tenantRouting';

export type PageReference =
  | { kind: 'home' }
  | { kind: 'credits' }
  | { kind: 'campus'; campusSlug: string }
  | { kind: 'club'; campusSlug: string; clubSlug: string };

export function pageKey(page: PageReference): string {
  switch (page.kind) {
    case 'home': return 'home';
    case 'credits': return 'credits';
    case 'campus': return `campus:${page.campusSlug.toLowerCase()}`;
    case 'club': return `club:${page.campusSlug.toLowerCase()}:${page.clubSlug.toLowerCase()}`;
  }
}

export function pagePath(page: PageReference): string {
  switch (page.kind) {
    case 'home': return '/';
    case 'credits': return '/credits';
    case 'campus': return buildCampusPath(page.campusSlug);
    case 'club': return buildClubPath(page.campusSlug, page.clubSlug);
  }
}

export function editorPath(page: PageReference): string {
  switch (page.kind) {
    case 'home': return '/editor/home';
    case 'credits': return '/editor/credits';
    case 'campus': return `/editor/campus/${encodeURIComponent(page.campusSlug)}`;
    case 'club': return buildEditorPath(page.campusSlug, page.clubSlug);
  }
}

export function parseEditorPath(pathname: string, campuses: Campus[]): PageReference | null {
  if (pathname === '/editor/home') return { kind: 'home' };
  if (pathname === '/editor/credits') return { kind: 'credits' };
  const campusMatch = pathname.match(/^\/editor\/campus\/([^/]+)\/?$/);
  if (campusMatch) return { kind: 'campus', campusSlug: decodeURIComponent(campusMatch[1]) };
  const clubMatch = pathname.match(/^\/editor\/([^/]+)\/([^/]+)\/?$/);
  if (clubMatch) return { kind: 'club', campusSlug: decodeURIComponent(clubMatch[1]), clubSlug: decodeURIComponent(clubMatch[2]) };
  const legacyMatch = pathname.match(/^\/editor\/([^/]+)\/?$/);
  if (!legacyMatch) return null;
  const tenant = decodeURIComponent(legacyMatch[1]).toLowerCase();
  const campus = [...campuses].sort((a, b) => b.slug.length - a.slug.length).find((candidate) => tenant.endsWith(`-${candidate.slug}`));
  return campus ? { kind: 'club', campusSlug: campus.slug, clubSlug: tenant.slice(0, -(campus.slug.length + 1)) } : null;
}

export function pageExists(page: PageReference, campuses: Campus[], clubs: Club[]): boolean {
  if (page.kind === 'home' || page.kind === 'credits') return true;
  if (!campuses.some((campus) => campus.slug.toLowerCase() === page.campusSlug.toLowerCase())) return false;
  return page.kind === 'campus' || clubs.some((club) =>
    club.campusSlug.toLowerCase() === page.campusSlug.toLowerCase() &&
    club.slug.toLowerCase() === page.clubSlug.toLowerCase()
  );
}

export function pageLabel(page: PageReference, campuses: Campus[], clubs: Club[]): string {
  if (page.kind === 'home') return 'Pioneer Clubs directory';
  if (page.kind === 'credits') return 'Credits';
  const campus = campuses.find((candidate) => candidate.slug.toLowerCase() === page.campusSlug.toLowerCase());
  if (page.kind === 'campus') return `${campus?.name || page.campusSlug} club hub`;
  const club = clubs.find((candidate) => candidate.campusSlug.toLowerCase() === page.campusSlug.toLowerCase() && candidate.slug.toLowerCase() === page.clubSlug.toLowerCase());
  return `${club?.name || page.clubSlug} · ${campus?.shortName || page.campusSlug}`;
}

export function createDefaultPageData(page: PageReference, campuses: Campus[] = INITIAL_CAMPUSES, clubs: Club[] = INITIAL_CLUBS): Data {
  const id = pageKey(page).replace(/:/g, '-');
  const title = pageLabel(page, campuses, clubs);
  if (page.kind === 'home') return {
    root: { props: { title } },
    content: [{ type: 'DirectoryExperience', props: {
      id: `directory-${id}`,
      eyebrow: 'Pioneer Charter School of Science · pcssclubs.org',
      title: 'Student Organizations Across Every Pioneer Campus',
      description: 'Explore student clubs across Pioneer campuses. Find what interests you and learn where to start.',
    } }],
  };
  if (page.kind === 'campus') {
    const campus = campuses.find((candidate) => candidate.slug.toLowerCase() === page.campusSlug.toLowerCase());
    if (!campus) throw new Error(`Unknown campus page: ${page.campusSlug}`);
    return {
      root: { props: { title } },
      content: [{ type: 'DirectoryExperience', props: {
        id: `directory-${id}`,
        eyebrow: `${campus.name} · ${campus.subdomain}`,
        title: `${campus.name} Student Clubs & Societies`,
        description: `Explore clubs and activities at ${campus.name}. Find a group that interests you and see its meeting details.`,
      } }],
    };
  }
  if (page.kind === 'credits') return {
    root: { props: { title } },
    content: [{ type: 'CreditsExperience', props: {
      id: 'credits-main',
      ...CREDIT_PAGE_COPY,
      creditAreas: defaultCreditAreas(),
    } }],
  };
  throw new Error('Club defaults are generated from the club registry');
}

export const PAGE_BLOCK_TYPES = [
  'DirectoryExperience', 'CreditsExperience', 'TextSection', 'ClubHero',
  'AnnouncementBanner', 'MeetingScheduleCard', 'RosterAndLeadership',
  'AchievementsTimeline', 'PhotoGallery', 'RichTextAndResources',
] as const;

const creditPersonFields = ['name', 'role', 'contribution', 'url', 'schoolName', 'schoolUrl'] as const;

function validCreditPerson(person: unknown): person is EditableCreditPerson {
  return person !== null && typeof person === 'object' &&
    creditPersonFields.every((field) => typeof (person as Record<string, unknown>)[field] === 'string');
}

/** Keep credits saved before contribution areas existed editable without losing any names. */
export function normalizePageData(page: PageReference, data: Data): Data {
  if (page.kind !== 'credits' || !Array.isArray(data?.content)) return data;
  const block = data.content.find((entry) => entry.type === 'CreditsExperience');
  if (!block) return data;
  const legacy = block.props.contributors;
  const hasAreas = Array.isArray(block.props.creditAreas);
  if (!hasAreas && (!Array.isArray(legacy) || !legacy.every((person) => validCreditPerson(person) && typeof (person as unknown as LegacyContributor).group === 'string'))) return data;
  const previousCopy: Record<string, string> = {
    eyebrow: 'The people behind the portal',
    title: 'Made together, for every club.',
    description: 'A student-led idea grows through the people who build, guide, support, and share it.',
    contributorsTitle: 'The people and work behind Pioneer Clubs',
    contributorsDescription: 'Credit is specific here. We name the work people contributed and add names only when their participation and permission to be listed are confirmed.',
    sectionEyebrow: 'A living record',
    recognitionNote: 'More names will appear in these areas as contributions are confirmed and people agree to be listed.',
  };
  const creditAreas = (hasAreas ? block.props.creditAreas : areasFromLegacyContributors(legacy)) as EditableCreditArea[];
  const updatedAreas = creditAreas.map((area) => {
    if (!area || typeof area !== 'object' || !Array.isArray(area.people)) return area;
    return {
      ...area,
      title: area.title === 'Creation & development' ? 'Project beginnings' : area.title,
      description: area.description === 'The student-led idea, design, writing, and engineering behind the portal.'
        ? 'The first version of a shared place for PCSS clubs, with room for others to guide and improve it.' : area.description,
      people: area.people.map((person) => {
        if (!person || !['Aarti S. Ravikumar', 'Aarti Sri Ravikumar', 'Aarti S Ravikumar'].includes(person.name)) return person;
        return {
          ...person,
          name: 'Aarti S Ravikumar',
          role: ['Student creator and developer', 'Student creator and contributor'].includes(person.role)
            ? 'Student creator, admin and contributor' : person.role,
          contribution: person.contribution === 'Concept, design, and development'
            ? 'Started and built the first version in service of PCSS clubs.' : person.contribution,
        };
      }),
    };
  });
  return {
    ...data,
    content: data.content.map((entry) => entry === block
      ? { ...entry, props: {
          ...CREDIT_PAGE_COPY,
          ...entry.props,
          ...Object.fromEntries(Object.entries(previousCopy)
            .filter(([key, oldValue]) => entry.props[key] === oldValue)
            .map(([key]) => [key, CREDIT_PAGE_COPY[key as keyof typeof CREDIT_PAGE_COPY]])),
          creditAreas: updatedAreas,
          contributors: undefined,
          featuredLabel: undefined,
          emptyAreaMessage: undefined,
        } }
      : entry),
  };
}

export function isValidPageData(page: PageReference, data: Data): boolean {
  data = normalizePageData(page, data);
  if (!data || !data.root || !Array.isArray(data.content)) return false;
  if (!data.content.every((entry) =>
    entry && typeof entry.type === 'string' &&
    PAGE_BLOCK_TYPES.includes(entry.type as typeof PAGE_BLOCK_TYPES[number]) &&
    entry.props && typeof entry.props === 'object' && typeof entry.props.id === 'string'
  )) return false;
  const directoryBlocks = data.content.filter((entry) => entry.type === 'DirectoryExperience').length;
  const creditsBlocks = data.content.filter((entry) => entry.type === 'CreditsExperience').length;
  if (page.kind === 'home' || page.kind === 'campus') return directoryBlocks === 1 && creditsBlocks === 0;
  if (page.kind === 'credits') {
    const credits = data.content.find((entry) => entry.type === 'CreditsExperience');
    return creditsBlocks === 1 && directoryBlocks === 0 &&
      Array.isArray(credits?.props.creditAreas) && credits.props.creditAreas.length > 0 &&
      credits.props.creditAreas.every((area: unknown) =>
        area !== null && typeof area === 'object' &&
        typeof (area as Record<string, unknown>).title === 'string' &&
        typeof (area as Record<string, unknown>).description === 'string' &&
        Array.isArray((area as Record<string, unknown>).people) &&
        ((area as Record<string, unknown>).people as unknown[]).every(validCreditPerson)
      );
  }
  return directoryBlocks === 0 && creditsBlocks === 0 && data.content.length > 0;
}
