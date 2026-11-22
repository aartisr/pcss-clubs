export interface Credit {
  name: string;
  role: string;
  contribution?: string;
  url?: string;
  school?: {
    name: string;
    url: string;
  };
}

export const STUDENT_WEB_ADMIN_NAME = 'Aarti S Ravikumar';
export const STUDENT_WEB_ADMIN_CREDITS_ANCHOR = 'student-web-admin';
export const STUDENT_WEB_ADMIN_CREDITS_PATH = `/credits#${STUDENT_WEB_ADMIN_CREDITS_ANCHOR}`;

export interface CreditGroup {
  title: string;
  description: string;
  people: Credit[];
}

export interface EditableCreditPerson {
  name: string;
  role: string;
  contribution: string;
  url: string;
  schoolName: string;
  schoolUrl: string;
}

export interface EditableCreditArea {
  title: string;
  description: string;
  people: EditableCreditPerson[];
}

export interface LegacyContributor extends EditableCreditPerson {
  group: string;
}

export function safeCreditUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export const CREDIT_PAGE_COPY = {
  eyebrow: 'People behind the portal',
  title: 'Built to serve PCSS clubs.',
  description: 'Pioneer Clubs began as a student project for the PCSS community. This page recognizes the people whose work helps it grow.',
  contributorsTitle: 'Contributions, with gratitude',
  contributorsDescription: 'We name the work, credit people with their permission, and leave room for students, mentors, IT teams, and school staff as they contribute.',
  heroLinkLabel: 'Meet the contributors',
  sectionEyebrow: 'A growing record',
  backLinkLabel: 'Explore the clubs',
  recognitionNote: 'More names will be added as contributions are confirmed and people agree to be listed.',
  suggestionTitle: 'A credit missing or incorrect?',
  suggestionDescription: 'Tell us who contributed and what they worked on. We’ll confirm details before adding a public name.',
  suggestionLinkLabel: 'Suggest a credit',
  suggestionLinkUrl: '/support#corrections',
};

// Add confirmed contributors to the appropriate group. The page grows with these arrays.
export const CREDIT_GROUPS: CreditGroup[] = [
  {
    title: 'Project beginnings',
    description: 'The first version of a shared place for PCSS clubs, with room for others to guide and improve it.',
    people: [
      {
        name: STUDENT_WEB_ADMIN_NAME,
        role: 'Student creator, admin and contributor',
        contribution: 'Started and built the first version in service of PCSS clubs.',
        url: 'https://ai-aarti.com',
        school: {
          name: 'PCSS II',
          url: 'https://saugus.pioneercss.org',
        },
      },
    ],
  },
  {
    title: 'Student contributors',
    description: 'Students who research, write, test, design, or improve club information.',
    people: [],
  },
  {
    title: 'Club mentors & advisors',
    description: 'Adults who guide clubs and help students turn ideas into activities.',
    people: [],
  },
  {
    title: 'IT & digital support',
    description: 'People who help with access, reliability, security, and the technology behind the portal.',
    people: [],
  },
  {
    title: 'School administration',
    description: 'School leaders whose confirmed support helps student organizations thrive.',
    people: [],
  },
  {
    title: 'Stories & media',
    description: 'Writers, photographers, and storytellers who bring club life into focus.',
    people: [],
  },
];

export function defaultCreditAreas(): EditableCreditArea[] {
  return CREDIT_GROUPS.map((group) => ({
    title: group.title,
    description: group.description,
    people: group.people.map((person) => ({
      name: person.name,
      role: person.role,
      contribution: person.contribution || '',
      url: person.url || '',
      schoolName: person.school?.name || '',
      schoolUrl: person.school?.url || '',
    })),
  }));
}

export function areasFromLegacyContributors(contributors: LegacyContributor[]): EditableCreditArea[] {
  const areas = defaultCreditAreas().map((area) => ({ ...area, people: [] as EditableCreditPerson[] }));
  for (const { group, ...person } of contributors) {
    let area = areas.find((item) => item.title === (group === 'Creation & development' ? 'Project beginnings' : group));
    if (!area) {
      area = { title: group || 'Other contributions', description: 'Additional contributions to Pioneer Clubs.', people: [] };
      areas.push(area);
    }
    area.people.push(person);
  }
  return areas;
}
