import type { Data } from '@measured/puck';

export type BuiltInClubCategory =
  | 'STEM & Robotics'
  | 'Science & Research'
  | 'Mathematics'
  | 'Humanities & Debate'
  | 'Arts & Media'
  | 'Leadership & Service'
  | 'Athletics';

export type ClubCategory = BuiltInClubCategory | (string & {});

export type CampusThemeColor = 'navy' | 'crimson' | 'slate' | 'gold';

export interface CampusThemeToken {
  label: string;
  hex: string;
  textClass: string;
  activeButtonClass: string;
  heroTheme: 'navy' | 'crimson';
}

export const CAMPUS_THEME_TOKENS: Record<CampusThemeColor, CampusThemeToken> = {
  navy: {
    label: 'Navy',
    hex: '#0B2240',
    textClass: 'text-[#0B2240] dark:text-[#93C5FD]',
    activeButtonClass: 'bg-[#0B2240] dark:bg-[#1E3A5F] text-white border-[#0B2240] dark:border-[#3B82F6]',
    heroTheme: 'navy',
  },
  crimson: {
    label: 'Crimson',
    hex: '#8B1E24',
    textClass: 'text-[#8B1E24] dark:text-[#FCA5A5]',
    activeButtonClass: 'bg-[#8B1E24] text-white border-[#8B1E24]',
    heroTheme: 'crimson',
  },
  slate: {
    label: 'Slate',
    hex: '#1E3A5F',
    textClass: 'text-[#1E3A5F] dark:text-slate-300',
    activeButtonClass: 'bg-[#1E3A5F] text-white border-[#1E3A5F]',
    heroTheme: 'navy',
  },
  gold: {
    label: 'Gold',
    hex: '#B45309',
    textClass: 'text-[#92400E] dark:text-[#FCD34D]',
    activeButtonClass: 'bg-[#92400E] text-white border-[#92400E]',
    heroTheme: 'navy',
  },
};

export type MeetingDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface Campus {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  address: string;
  gradesServed: string;
  themeColor: CampusThemeColor;
  subdomain: string;
  foundedYear: number;
}

export interface Club {
  id: string;
  slug: string;
  campusSlug: string;
  name: string;
  category: ClubCategory;
  shortDescription: string;
  advisorName: string;
  advisorEmail: string;
  studentLead: string;
  meetingDays: MeetingDay[];
  meetingTime: string;
  roomNumber: string;
  memberCount: number;
  subdomain: string;
  coverImage: string;
  openEnrollment: boolean;
}

export const GENERATED_IMAGES = {
  campusHero: '/src/assets/images/hero_pcss_campus_1795074334584.webp',
  roboticsLab: '/src/assets/images/club_robotics_lab_1795074334521.webp',
  scienceLab: '/src/assets/images/club_science_olympiad_1795074334565.webp',
  mathSeminar: '/src/assets/images/club_math_league_1795074333879.webp',
} as const;

const builtInImagePaths = new Set<string>(Object.values(GENERATED_IMAGES));

/** Keep browser-saved layouts from the JPEG era working after the WebP migration. */
export function resolveBuiltInImageUrl(src: string): string {
  const legacy = src.match(/^(.*)(\/src\/assets\/images\/[^?#]+)\.jpg([?#].*)?$/i);
  if (!legacy) return src;
  const webpPath = `${legacy[2]}.webp`;
  return builtInImagePaths.has(webpPath) ? `${legacy[1]}${webpPath}${legacy[3] || ''}` : src;
}

export const INITIAL_CAMPUSES: Campus[] = [
  {
    id: 'campus-pcss1',
    slug: 'pcss1',
    name: 'PCSS I — Everett',
    shortName: 'PCSS I',
    city: 'Everett, MA',
    address: '51 Summer St, Everett, MA 02149',
    gradesServed: 'Grades 7–12',
    themeColor: 'navy',
    subdomain: 'pcss1.pcssclubs.org',
    foundedYear: 2007,
  },
  {
    id: 'campus-pcss2',
    slug: 'pcss2',
    name: 'PCSS II — Saugus',
    shortName: 'PCSS II',
    city: 'Saugus, MA',
    address: '97 Main St, Saugus, MA 01906',
    gradesServed: 'Grades 7–12',
    themeColor: 'crimson',
    subdomain: 'pcss2.pcssclubs.org',
    foundedYear: 2013,
  },
];

export const INITIAL_CLUBS: Club[] = [
  {
    id: 'club-pcss1-robotics',
    slug: 'robotics',
    campusSlug: 'pcss1',
    name: 'Pioneer Robotics (FRC Team 4567)',
    category: 'STEM & Robotics',
    shortDescription:
      'Design, machine, wire, and program 120-pound autonomous competition robots for the FIRST Robotics New England District.',
    advisorName: 'Dr. Elena Rostova',
    advisorEmail: 'erostova@pioneercss.org',
    studentLead: 'Marcus Chen (Captain, ’27)',
    meetingDays: ['Tuesday', 'Thursday', 'Saturday'],
    meetingTime: '3:15 PM – 5:45 PM',
    roomNumber: 'Engineering Bay 104',
    memberCount: 38,
    subdomain: 'robotics.pcss1.pcssclubs.org',
    coverImage: GENERATED_IMAGES.roboticsLab,
    openEnrollment: true,
  },
  {
    id: 'club-pcss1-science',
    slug: 'science',
    campusSlug: 'pcss1',
    name: 'Science Olympiad Varsity',
    category: 'Science & Research',
    shortDescription:
      'Prepare across 23 competitive laboratory, earth-science, and engineering events for MIT and Harvard Invitational tournaments.',
    advisorName: 'Prof. David Alverez',
    advisorEmail: 'dalverez@pioneercss.org',
    studentLead: 'Priya Subramanian (Co-Captain, ’27)',
    meetingDays: ['Monday', 'Wednesday'],
    meetingTime: '3:15 PM – 4:45 PM',
    roomNumber: 'BioChem Lab 302',
    memberCount: 32,
    subdomain: 'science.pcss1.pcssclubs.org',
    coverImage: GENERATED_IMAGES.scienceLab,
    openEnrollment: true,
  },
  {
    id: 'club-pcss1-math',
    slug: 'math',
    campusSlug: 'pcss1',
    name: 'Mu Alpha Theta Math League',
    category: 'Mathematics',
    shortDescription:
      'Weekly problem-solving seminars training for AMC 10/12, AIME, and the Massachusetts Association of Mathematics Leagues.',
    advisorName: 'Mr. Nathaniel Brooks',
    advisorEmail: 'nbrooks@pioneercss.org',
    studentLead: 'Sophia Lindqvist (President, ’27)',
    meetingDays: ['Wednesday', 'Friday'],
    meetingTime: '3:15 PM – 4:30 PM',
    roomNumber: 'Seminar Room 214',
    memberCount: 27,
    subdomain: 'math.pcss1.pcssclubs.org',
    coverImage: GENERATED_IMAGES.mathSeminar,
    openEnrollment: true,
  },
  {
    id: 'club-pcss1-debate',
    slug: 'debate',
    campusSlug: 'pcss1',
    name: 'Model UN & Civic Debate',
    category: 'Humanities & Debate',
    shortDescription:
      'Parliamentary argumentation, international policy drafting, and regional Model UN delegations across Greater Boston.',
    advisorName: 'Ms. Claire Donovan',
    advisorEmail: 'cdonovan@pioneercss.org',
    studentLead: 'Tariq Mansour (Head Delegate, ’28)',
    meetingDays: ['Tuesday'],
    meetingTime: '3:15 PM – 4:45 PM',
    roomNumber: 'Humanities Hall 118',
    memberCount: 24,
    subdomain: 'debate.pcss1.pcssclubs.org',
    coverImage: GENERATED_IMAGES.campusHero,
    openEnrollment: true,
  },
  {
    id: 'club-pcss2-robotics',
    slug: 'robotics',
    campusSlug: 'pcss2',
    name: 'Saugus VEX & Autonomous Robotics',
    category: 'STEM & Robotics',
    shortDescription:
      'Rapid CAD prototyping, PID drivetrain tuning, and autonomous sensor fusion for VEX V5 High School competitions.',
    advisorName: 'Mr. Samuel Okafor',
    advisorEmail: 'sokafor@pioneercss.org',
    studentLead: 'Lucas Ferreira (Lead Programmer, ’27)',
    meetingDays: ['Tuesday', 'Thursday'],
    meetingTime: '3:10 PM – 5:15 PM',
    roomNumber: 'Fab Lab 112',
    memberCount: 31,
    subdomain: 'robotics.pcss2.pcssclubs.org',
    coverImage: GENERATED_IMAGES.roboticsLab,
    openEnrollment: true,
  },
  {
    id: 'club-pcss2-science',
    slug: 'science',
    campusSlug: 'pcss2',
    name: 'BioMed & Science Bowl',
    category: 'Science & Research',
    shortDescription:
      'Buzzer-round STEM quiz competition and applied microbiology lab investigations for the DOE Regional Science Bowl.',
    advisorName: 'Dr. Hannah Cho',
    advisorEmail: 'hcho@pioneercss.org',
    studentLead: 'Amara Patel (Captain, ’27)',
    meetingDays: ['Monday', 'Thursday'],
    meetingTime: '3:10 PM – 4:40 PM',
    roomNumber: 'Lab Suite 208',
    memberCount: 29,
    subdomain: 'science.pcss2.pcssclubs.org',
    coverImage: GENERATED_IMAGES.scienceLab,
    openEnrollment: true,
  },
  {
    id: 'club-pcss2-math',
    slug: 'math',
    campusSlug: 'pcss2',
    name: 'Pioneer Competition Math',
    category: 'Mathematics',
    shortDescription:
      'Combinatorics, number theory, and olympiad proof workshops preparing students for HMMT and New England Math League.',
    advisorName: 'Ms. Rebecca Kim',
    advisorEmail: 'rkim@pioneercss.org',
    studentLead: 'Ethan Morales (Captain, ’28)',
    meetingDays: ['Wednesday'],
    meetingTime: '3:10 PM – 4:30 PM',
    roomNumber: 'Room 205',
    memberCount: 22,
    subdomain: 'math.pcss2.pcssclubs.org',
    coverImage: GENERATED_IMAGES.mathSeminar,
    openEnrollment: true,
  },
  {
    id: 'club-pcss2-arts',
    slug: 'arts',
    campusSlug: 'pcss2',
    name: 'Editorial & Digital Media Guild',
    category: 'Arts & Media',
    shortDescription:
      'Student-run campus quarterly journal, documentary photography, and digital broadcast production for Pioneer Saugus.',
    advisorName: 'Mr. Julian Mercer',
    advisorEmail: 'jmercer@pioneercss.org',
    studentLead: 'Nadia Kowalski (Editor-in-Chief, ’27)',
    meetingDays: ['Friday'],
    meetingTime: '3:10 PM – 4:30 PM',
    roomNumber: 'Media Studio 109',
    memberCount: 19,
    subdomain: 'arts.pcss2.pcssclubs.org',
    coverImage: GENERATED_IMAGES.campusHero,
    openEnrollment: true,
  },
];

export const CLUB_CATEGORIES: ClubCategory[] = [
  'STEM & Robotics',
  'Science & Research',
  'Mathematics',
  'Humanities & Debate',
  'Arts & Media',
  'Leadership & Service',
  'Athletics',
];

export const MEETING_DAYS: MeetingDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function createDefaultPuckData(club: Club, campus: Campus): Data {
  const hasSchedule = club.meetingDays.length > 0 || Boolean(club.meetingTime.trim() || club.roomNumber.trim());
  const members = [
    ...(club.advisorName.trim() ? [{ name: club.advisorName, role: 'Faculty Advisor', detail: campus.shortName, email: club.advisorEmail }] : []),
    ...(club.studentLead.trim() ? [{ name: club.studentLead, role: 'Student Lead', detail: '', email: '' }] : []),
  ];
  const content: Data['content'] = [{
    type: 'ClubHero',
    props: {
      id: `hero-${club.id}`,
      eyebrow: `${campus.name} · ${club.category}`,
      title: club.name,
      subtitle: club.shortDescription,
      backgroundImage: club.coverImage || GENERATED_IMAGES.campusHero,
      layout: 'split',
      theme: campus.themeColor === 'crimson' ? 'crimson' : 'navy',
      primaryCtaLabel: hasSchedule ? 'Meeting Details' : 'More Campus Clubs',
      primaryCtaHref: hasSchedule ? '#schedule' : `/campus/${campus.slug}`,
      secondaryCtaLabel: hasSchedule ? 'More Campus Clubs' : '',
      secondaryCtaHref: hasSchedule ? `/campus/${campus.slug}` : '',
    },
  }];
  if (hasSchedule) content.push({
    type: 'MeetingScheduleCard',
    props: {
      id: `schedule-${club.id}`,
      heading: 'Meeting Details',
      days: club.meetingDays.join(' · '),
      time: club.meetingTime,
      room: club.roomNumber,
      campusLocation: campus.address,
      calendarUrl: '',
      virtualLinkUrl: '',
    },
  });
  if (members.length) content.push({
    type: 'RosterAndLeadership',
    props: {
      id: `roster-${club.id}`,
      heading: 'Advisors & Student Leadership',
      subheading: '',
      members,
    },
  });
  return { root: { props: { title: `${club.name} · ${campus.shortName}` } }, content };
}
