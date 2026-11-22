import type { Campus, Club } from './registry';

export type CampusDraft = Omit<Campus, 'id' | 'subdomain'>;
export type ClubDraft = Omit<Club, 'id' | 'subdomain'>;

export function emptyCampusDraft(): CampusDraft {
  return {
    name: '', shortName: '', slug: '', city: '', address: '', gradesServed: '',
    foundedYear: 0, themeColor: 'slate',
  };
}

export function emptyClubDraft(campusSlug: string): ClubDraft {
  return {
    name: '', slug: '', campusSlug, category: 'General Interest', shortDescription: '',
    advisorName: '', advisorEmail: '', studentLead: '', meetingDays: [],
    meetingTime: '', roomNumber: '', memberCount: 0, coverImage: '', openEnrollment: false,
  };
}
