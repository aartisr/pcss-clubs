import type { Campus, Club, MeetingDay } from './registry';

export interface ClubFilter {
  campusSlugs?: string[];
  category?: string;
  day?: MeetingDay;
  query?: string;
}

export function filterClubs(clubs: Club[], campuses: Campus[], filter: ClubFilter = {}): Club[] {
  const query = filter.query?.trim().toLowerCase() || '';
  const campusNames = new Map(campuses.map((campus) => [campus.slug.toLowerCase(), campus.name.toLowerCase()]));
  const selectedCampuses = new Set(filter.campusSlugs?.map((slug) => slug.toLowerCase()));
  return clubs.filter((club) => {
    if (selectedCampuses.size && !selectedCampuses.has(club.campusSlug.toLowerCase())) return false;
    if (filter.category && club.category !== filter.category) return false;
    if (filter.day && !club.meetingDays.includes(filter.day)) return false;
    if (!query) return true;
    return [
      club.name, club.shortDescription, club.category, club.advisorName,
      club.advisorEmail, club.studentLead, club.subdomain,
      campusNames.get(club.campusSlug.toLowerCase()) || club.campusSlug,
      ...club.meetingDays,
    ].some((value) => value.toLowerCase().includes(query));
  });
}

export function totalClubMembers(clubs: Club[]): number {
  return clubs.reduce((total, club) => total + club.memberCount, 0);
}
